/**
 * Script to delete duplicate monthly invoices
 * 
 * This script finds all duplicate monthly invoices (same company, same month)
 * and deletes them, keeping only the most recent one for each company/month combination.
 * 
 * Usage: Import and call deleteDuplicateMonthlyInvoices() from the browser console
 * or from a migration script.
 */

import { deleteDuplicateMonthlyInvoices } from "./invoiceService";

/**
 * Run the duplicate invoice cleanup
 */
export const runDuplicateInvoiceCleanup = async (): Promise<void> => {
  try {
    console.log("🚀 Starting duplicate monthly invoice cleanup...\n");

    const result = await deleteDuplicateMonthlyInvoices();

    console.log("\n📋 Cleanup Results:");
    console.log(`   - Total duplicates found: ${result.totalDuplicates}`);
    console.log(`   - Successfully deleted: ${result.deletedCount}`);
    console.log(`   - Errors: ${result.errors.length}`);

    if (result.details.length > 0) {
      console.log("\n📝 Details by company/month:");
      result.details.forEach((detail) => {
        console.log(
          `   - Company: ${detail.companyId}, Month: ${detail.monthName}`
        );
        console.log(`     Kept: ${detail.keptInvoiceId}`);
        console.log(
          `     Deleted: ${detail.deletedInvoiceIds.join(", ")}`
        );
      });
    }

    if (result.errors.length > 0) {
      console.log("\n⚠️ Errors encountered:");
      result.errors.forEach((error) => {
        console.log(`   - ${error}`);
      });
    }

    console.log("\n✅ Cleanup completed!");
  } catch (error) {
    console.error("❌ Error running duplicate invoice cleanup:", error);
    throw error;
  }
};

// Export the function directly for easy access
export { deleteDuplicateMonthlyInvoices };

