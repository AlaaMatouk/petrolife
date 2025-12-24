import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Query,
  CollectionReference,
  DocumentSnapshot,
  QuerySnapshot,
  FirestoreError,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface UseFirestoreListenerOptions<T> {
  collectionName: string;
  queryFn?: (ref: CollectionReference) => Query;
  transformFn?: (doc: DocumentSnapshot) => T;
  orderByField?: string;
  orderByDirection?: "asc" | "desc";
  enabled?: boolean; // Allow disabling the listener
}

export interface UseFirestoreListenerResult<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
  unsubscribe: (() => void) | null;
}

/**
 * Reusable hook for Firestore real-time listeners
 * Follows the pattern from Classifications.tsx
 * 
 * @example
 * const { data, loading, error } = useFirestoreListener({
 *   collectionName: "categories",
 *   orderByField: "createdDate",
 *   orderByDirection: "desc",
 * });
 */
export const useFirestoreListener = <T = any>({
  collectionName,
  queryFn,
  transformFn,
  orderByField,
  orderByDirection = "desc",
  enabled = true,
}: UseFirestoreListenerOptions<T>): UseFirestoreListenerResult<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const collectionRef = collection(db, collectionName);
      
      // Build query
      let q: Query;
      if (queryFn) {
        // Use custom query function if provided
        q = queryFn(collectionRef);
      } else if (orderByField) {
        // Use orderBy if field is provided
        q = query(collectionRef, orderBy(orderByField, orderByDirection));
      } else {
        // No ordering, just collection reference
        q = query(collectionRef);
      }

      // Set up real-time listener
      const unsubscribeFn = onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
          const docs = snapshot.docs.map((doc) => {
            if (transformFn) {
              return transformFn(doc);
            }
            return {
              id: doc.id,
              ...doc.data(),
            } as T;
          });
          setData(docs);
          setLoading(false);
          setError(null);
        },
        (err: FirestoreError) => {
          console.error(`❌ Error listening to ${collectionName}:`, err);
          setError(err);
          setLoading(false);
        }
      );

      setUnsubscribe(() => unsubscribeFn);

      // Cleanup function
      return () => {
        unsubscribeFn();
      };
    } catch (err) {
      console.error(`❌ Error setting up listener for ${collectionName}:`, err);
      setError(err as FirestoreError);
      setLoading(false);
    }
  }, [collectionName, orderByField, orderByDirection, enabled, queryFn, transformFn]);

  return {
    data,
    loading,
    error,
    unsubscribe,
  };
};

