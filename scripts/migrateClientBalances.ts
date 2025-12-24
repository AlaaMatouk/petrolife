/**
 * Migration Script: Add balance field to existing clients
 * 
 * This script updates all client documents in the "clients" collection
 * that are missing the balance field by setting it to 0.
 * 
 * Run this script once to fix existing clients created before the balance field was added.
 * 
 * Usage:
 *   npx ts-node scripts/migrateClientBalances.ts
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

// Firebase configuration (update with your project's config)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface ClientData {
  id: string;
  name?: string;
  email?: string;
  balance?: number;
  [key: string]: any;
}

async function migrateClientBalances() {
  console.log("🔄 Starting client balance migration...\n");

  try {
    // Fetch all clients
    const clientsRef = collection(db, "clients");
    const snapshot = await getDocs(clientsRef);

    console.log(`📊 Total clients found: ${snapshot.size}`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const clientsToUpdate: ClientData[] = [];

    // Identify clients without balance field
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data() as ClientData;
      const clientId = docSnapshot.id;

      // Check if balance field exists
      if (data.balance === undefined) {
        clientsToUpdate.push({
          id: clientId,
          name: data.name || "Unknown",
          email: data.email || "Unknown",
        });
      } else {
        skippedCount++;
      }
    });

    console.log(`\n📋 Clients needing balance field: ${clientsToUpdate.length}`);
    console.log(`✅ Clients already with balance: ${skippedCount}\n`);

    if (clientsToUpdate.length === 0) {
      console.log("✨ All clients already have the balance field. No migration needed!");
      return;
    }

    // Confirm before proceeding
    console.log("📝 Clients to be updated:");
    clientsToUpdate.slice(0, 5).forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.name} (${client.email}) - ID: ${client.id}`);
    });
    if (clientsToUpdate.length > 5) {
      console.log(`  ... and ${clientsToUpdate.length - 5} more\n`);
    }

    console.log("⚠️  WARNING: This will add balance: 0 to all clients listed above.");
    console.log("🔄 Starting update process...\n");

    // Update clients in batches
    for (const client of clientsToUpdate) {
      try {
        const clientDocRef = doc(db, "clients", client.id);
        
        // Double-check the client still exists
        const clientDoc = await getDoc(clientDocRef);
        if (!clientDoc.exists()) {
          console.log(`⚠️  Client ${client.id} no longer exists, skipping...`);
          continue;
        }

        // Update with balance: 0
        await updateDoc(clientDocRef, {
          balance: 0,
        });

        updatedCount++;
        console.log(`✅ Updated ${updatedCount}/${clientsToUpdate.length}: ${client.name} (${client.email})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating client ${client.id}:`, error);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(50));
    console.log(`✅ Successfully updated: ${updatedCount} clients`);
    console.log(`⏭️  Skipped (already had balance): ${skippedCount} clients`);
    console.log(`❌ Failed: ${errorCount} clients`);
    console.log(`📊 Total clients: ${snapshot.size}`);
    console.log("=".repeat(50));

    if (updatedCount > 0) {
      console.log("\n✨ Migration completed successfully!");
      console.log("🎯 All clients now have the balance field initialized.");
    }

    if (errorCount > 0) {
      console.log("\n⚠️  Some updates failed. Please check the errors above and retry if needed.");
    }

  } catch (error) {
    console.error("\n❌ Fatal error during migration:", error);
    throw error;
  }
}

// Run the migration
migrateClientBalances()
  .then(() => {
    console.log("\n✅ Migration script completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
