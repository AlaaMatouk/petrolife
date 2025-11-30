/**
 * Migration script to generate invoices for all existing orders
 * This script processes all existing orders and creates invoices:
 * - For clients: One invoice per order
 * - For companies: Monthly aggregated invoices
 */

import {
  fetchAllOrdersDocuments,
  fetchAllClients,
  fetchAllCompanies,
} from "./firestore";
import {
  processClientOrders,
  processCompanyMonthlyInvoices,
  generateClientInvoice,
  generateCompanyMonthlyInvoice,
} from "./invoiceService";

/**
 * Generate invoices for all existing orders
 * This is a one-time migration script
 */
export const generateInvoicesForExistingOrders = async (): Promise<{
  clientInvoicesCreated: number;
  companyInvoicesCreated: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let clientInvoicesCreated = 0;
  let companyInvoicesCreated = 0;

  try {
    console.log("🔄 Starting invoice generation for existing orders...");

    // Fetch all orders
    console.log("📦 Fetching all orders...");
    const allOrders = await fetchAllOrdersDocuments();
    console.log(`✅ Found ${allOrders.length} orders`);

    // Fetch all clients and companies
    console.log("👥 Fetching all clients and companies...");
    const [allClients, allCompanies] = await Promise.all([
      fetchAllClients(),
      fetchAllCompanies(),
    ]);
    console.log(
      `✅ Found ${allClients.length} clients and ${allCompanies.length} companies`
    );

    // Create maps for quick lookup
    const clientMap = new Map<string, any>();
    allClients.forEach((client) => {
      // Add multiple keys for lookup flexibility
      const keys = [client.email, client.uid, client.id, client.uId].filter(
        Boolean
      );
      keys.forEach((key) => {
        if (key) {
          clientMap.set(key, client);
        }
      });
    });

    const companyMap = new Map<string, any>();
    allCompanies.forEach((company) => {
      // Add multiple keys for lookup flexibility (email, uid, id, uId)
      const keys = [company.email, company.uid, company.id, company.uId].filter(
        Boolean
      );
      keys.forEach((key) => {
        if (key) {
          companyMap.set(key, company);
        }
      });
    });

    // Group orders by owner (client or company)
    const clientOrdersMap = new Map<string, any[]>();
    const companyOrdersMap = new Map<string, Map<string, any[]>>(); // companyId -> month -> orders

    for (const order of allOrders) {
      // Check if order has companyUid field - this indicates it's a company order
      const companyId = order.companyUid;

      if (companyId) {
        // This is a company order - group by company and month
        const orderDate = order.orderDate?.toDate
          ? order.orderDate.toDate()
          : new Date(order.orderDate || Date.now());

        const monthKey = `${orderDate.getFullYear()}-${String(
          orderDate.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!companyOrdersMap.has(companyId)) {
          companyOrdersMap.set(companyId, new Map());
        }
        const companyMonths = companyOrdersMap.get(companyId)!;

        if (!companyMonths.has(monthKey)) {
          companyMonths.set(monthKey, []);
        }
        companyMonths.get(monthKey)!.push(order);
      } else {
        // This is a client order - get client identifier
        const clientId =
          order.clientId ||
          order.client?.email ||
          order.clientEmail ||
          order.client?.uid;

        if (!clientId) {
          errors.push(
            `Order ${
              order.id || order.docId
            } has no client identifier and no companyUid`
          );
          continue;
        }

        // Group by client
        if (!clientOrdersMap.has(clientId)) {
          clientOrdersMap.set(clientId, []);
        }
        clientOrdersMap.get(clientId)!.push(order);
      }
    }

    console.log(
      `📊 Grouped orders: ${clientOrdersMap.size} clients, ${companyOrdersMap.size} companies`
    );

    // Process client orders (one invoice per order)
    console.log("👤 Processing client invoices...");
    for (const [clientId, orders] of clientOrdersMap.entries()) {
      const client = clientMap.get(clientId);
      if (!client) {
        errors.push(`Client ${clientId} not found in client map`);
        continue;
      }

      // Check existing invoices for this client
      const { fetchInvoices } = await import("./invoiceService");
      const existingInvoices = await fetchInvoices({ clientId });
      const existingOrderIds = new Set(
        existingInvoices
          .filter((inv) => inv.type === "Client")
          .map((inv) => inv.orderId)
          .filter(Boolean)
      );

      for (const order of orders) {
        const orderId = order.id || order.docId;
        // Skip if invoice already exists for this order
        if (existingOrderIds.has(orderId)) {
          continue;
        }

        try {
          // Ensure order has id field for invoice generation
          const orderWithId = { ...order, id: orderId };
          const invoice = await generateClientInvoice(orderWithId, client);
          clientInvoicesCreated++;
          console.log(
            `✅ Created invoice ${invoice.invoiceNumber} for client ${clientId}, order ${orderId}`
          );
        } catch (error: any) {
          const errorMsg = `Error creating invoice for client ${clientId}, order ${orderId}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }

    // Process company orders (monthly invoices)
    console.log("🏢 Processing company monthly invoices...");
    for (const [companyId, monthsMap] of companyOrdersMap.entries()) {
      // Try to find company in the map (by uid, email, or id)
      let company = companyMap.get(companyId);

      // If not found, try alternative keys
      if (!company) {
        for (const [key, comp] of companyMap.entries()) {
          if (
            comp.uid === companyId ||
            comp.email === companyId ||
            comp.id === companyId
          ) {
            company = comp;
            break;
          }
        }
      }

      if (!company) {
        // Try to get company from first order's company data
        const firstOrder = Array.from(monthsMap.values())[0]?.[0];
        if (firstOrder?.company) {
          company = firstOrder.company;
        } else {
          errors.push(
            `Company ${companyId} not found in company map or order data`
          );
          continue;
        }
      }

      for (const [monthKey, orders] of monthsMap.entries()) {
        try {
          // Parse month key (YYYY-MM)
          const [year, month] = monthKey.split("-").map(Number);
          const targetMonth = new Date(year, month - 1, 1);

          // Check if invoice already exists
          const { fetchInvoices } = await import("./invoiceService");
          const existingInvoices = await fetchInvoices({
            type: "Company Monthly Invoice",
            companyUid: companyId,
          });

          const { getMonthName } = await import("./invoiceService");
          const monthName = getMonthName(targetMonth);
          const existingInvoice = existingInvoices.find(
            (inv) => inv.monthName === monthName
          );

          if (existingInvoice) {
            console.log(
              `ℹ️ Invoice already exists for company ${companyId} for ${monthKey}`
            );
            continue;
          }

          const invoice = await generateCompanyMonthlyInvoice(
            companyId,
            targetMonth,
            orders,
            company
          );

          companyInvoicesCreated++;
          console.log(
            `✅ Created invoice ${invoice.invoiceNumber} for company ${companyId} for ${monthKey}`
          );
        } catch (error: any) {
          const errorMsg = `Error processing company ${companyId} for ${monthKey}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }

    console.log("\n✅ Invoice generation completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Client invoices created: ${clientInvoicesCreated}`);
    console.log(`   - Company invoices created: ${companyInvoicesCreated}`);
    console.log(`   - Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log("\n⚠️ Errors encountered:");
      errors.slice(0, 10).forEach((error) => console.log(`   - ${error}`));
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }

    return {
      clientInvoicesCreated,
      companyInvoicesCreated,
      errors,
    };
  } catch (error: any) {
    console.error("❌ Fatal error in invoice generation:", error);
    throw error;
  }
};
