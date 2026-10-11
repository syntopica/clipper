// Resolves once the transaction has committed - the moment a write is durable,
// which is later than the moment its request succeeded.
export function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error ?? new Error('transaction aborted'))
  })
}
