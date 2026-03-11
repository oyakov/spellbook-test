name: solana-rpc
description: >
  Solana blockchain RPC API operations, transaction construction, and on-chain data queries.
  Use this skill whenever the user interacts with Solana — sending transactions, querying accounts,
  checking balances, working with SPL tokens, calling Solana programs, subscribing to events via
  WebSocket, or building any dApp or tool on Solana. Also use when the user mentions RPC endpoints,
  commitment levels, Solana clusters, validators, slots, blockhash, or any Web3/blockchain operation
  on Solana — even if they just say "check my wallet" or "send SOL".

## When to use
- User queries Solana account balances, token balances, or transaction history
- Constructing and sending Solana transactions
- Interacting with Solana programs (smart contracts)
- Working with SPL tokens (transfers, minting, metadata)
- Subscribing to on-chain events via WebSocket
- Configuring RPC endpoints, clusters, or commitment levels
- Debugging failed transactions or understanding Solana errors
- Building Solana dApps, bots, or automation tools

## Core Concepts

### Solana Architecture Basics
Solana uses a proof-of-stake consensus with a unique proof-of-history mechanism. Understanding the core model helps you make correct RPC calls.

**Key primitives:**
- **Accounts** — everything is an account (wallets, programs, data). Each has an owner program, lamport balance, and data field.
- **Programs** — on-chain code ("smart contracts"). They process instructions and modify account data.
- **Transactions** — contain one or more instructions, each targeting a program with specific accounts.
- **Slots** — time units (~400ms). Each slot has a leader validator that produces a block.
- **Epochs** — groups of slots (~2-3 days). Stake delegation changes take effect at epoch boundaries.

### Commitment Levels
Commitment determines how finalized the data you're reading is. Using the wrong commitment can cause you to act on data that gets rolled back.

- `finalized` — confirmed by supermajority, will not roll back. Safest but slowest (~30+ slots behind tip).
- `confirmed` — voted on by supermajority. Very unlikely to roll back. Good balance of speed and safety.
- `processed` — processed by connected node. Fastest but may roll back.

**Decision guide:**
```javascript
Are you displaying data to a user?
├─ YES → Use "confirmed" (fast enough, safe enough)
└─ NO  → Are you making a financial decision based on this data?
         ├─ YES → Use "finalized"
         └─ NO  → "processed" is OK for monitoring/dashboards
```

### Clusters and Endpoints
- **Mainnet-beta** — production: `https://api.mainnet-beta.solana.com`
- **Devnet** — testing with free SOL: `https://api.devnet.solana.com`
- **Testnet** — validator testing: `https://api.testnet.solana.com`

Public endpoints are rate-limited. For production use dedicated RPC providers (Helius, QuickNode, Alchemy, Triton).

## Instructions

### HTTP RPC Requests
All Solana RPC calls are JSON-RPC 2.0 POST requests.

**Basic structure:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "<method_name>",
  "params": ["<ordered_params>"]
}
```

### Essential RPC Methods

**Account & Balance Queries:**
```bash
# Get SOL balance
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '\
{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["<pubkey>",{"commitment":"confirmed"}]}'

# Get account info (data, owner, lamports)
curl ... -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["<pubkey>",{"encoding":"jsonParsed"}]}'

# Get all SPL token accounts for a wallet
curl ... -d '{"jsonrpc":"2.0","id":1,"method":"getTokenAccountsByOwner","params":["<wallet>",{"programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"encoding":"jsonParsed"}]}'
```

**Transaction Methods:**
```bash
# Get recent blockhash (needed for transactions)
curl ... -d '{"jsonrpc":"2.0","id":1,"method":"getLatestBlockhash","params":[{"commitment":"finalized"}]}'

# Send a signed transaction
curl ... -d '{"jsonrpc":"2.0","id":1,"method":"sendTransaction","params":["<base64_tx>",{"encoding":"base64","preflightCommitment":"confirmed"}]}'

# Get transaction details
curl ... -d '{"jsonrpc":"2.0","id":1,"method":"getTransaction","params":["<signature>",{"encoding":"jsonParsed","maxSupportedTransactionVersion":0}]}'

# Simulate a transaction before sending
curl ... -d '{"jsonrpc":"2.0","id":1,"method":"simulateTransaction","params":["<base64_tx>",{"encoding":"base64","commitment":"confirmed"}]}'
```

**Block & Slot Methods:**
```bash
# Current slot
curl ... -d '{"jsonrpc":"2.0","id":1,"method":"getSlot","params":[{"commitment":"confirmed"}]}'

# Get signatures for an address
curl ... -d '{"jsonrpc":"2.0","id":1,"method":"getSignaturesForAddress","params":["<pubkey>",{"limit":10}]}'
```

### WebSocket Subscriptions
Connect to `wss://api.devnet.solana.com` (or provider's WSS endpoint).

```json
// Subscribe to account changes
{"jsonrpc":"2.0","id":1,"method":"accountSubscribe","params":["<pubkey>",{"encoding":"jsonParsed","commitment":"confirmed"}]}

// Subscribe to log mentions of a program
{"jsonrpc":"2.0","id":1,"method":"logsSubscribe","params":[{"mentions":["<program_id>"]},{"commitment":"confirmed"}]}

// Subscribe to slot updates
{"jsonrpc":"2.0","id":1,"method":"slotSubscribe"}

// Unsubscribe
{"jsonrpc":"2.0","id":1,"method":"accountUnsubscribe","params":["<subscription_id>"]}
```

### Transaction Construction (JavaScript/TypeScript)
Using `@solana/web3.js`:

```typescript
import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// SOL transfer
const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: new PublicKey('recipient_address'),
    lamports: 1_000_000_000,  // 1 SOL = 1e9 lamports
  })
);

const signature = await sendAndConfirmTransaction(connection, tx, [sender]);
```

### Error Handling Patterns
Solana transactions fail for specific reasons. Understanding error codes prevents blind retries.

**Common errors and fixes:**
- `BlockhashNotFound` → Blockhash expired (~60s lifetime). Re-fetch and retry.
- `InsufficientFundsForRent` → Account below rent-exempt minimum. Add enough lamports.
- `AccountNotFound` → Querying non-existent account. Check existence first.
- `TransactionTooLarge` → Exceeds 1232 bytes. Split into multiple transactions.
- `NodeUnhealthy` → RPC node is behind. Switch to backup endpoint.

**Retry strategy:**
```typescript
async function sendWithRetry(connection, tx, signers, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      return await sendAndConfirmTransaction(connection, tx, signers);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      if (err.message.includes('BlockhashNotFound')) continue;
      throw err;  // Don't retry non-blockhash errors
    }
  }
}
```

### Production RPC Best Practices
1. **Use dedicated RPC providers** — public endpoints throttle at ~100 req/s. Helius, QuickNode, Alchemy offer dedicated nodes.
2. **Implement fallback endpoints** — if primary RPC is down, auto-switch to backup.
3. **Use `maxSupportedTransactionVersion: 0`** — versioned transactions are standard; omitting this drops v0 transactions.
4. **Always simulate before sending** — `simulateTransaction` catches errors without spending SOL.
5. **Batch requests** — many providers support JSON-RPC batching.
6. **Cache blockhash** — reuse for ~20 seconds instead of fetching per transaction.
7. **Use `jsonParsed` encoding** — human-readable response for known program accounts.

## Constraints
- **NEVER** hardcode private keys in source code — use environment variables or secure key management
- **NEVER** use `processed` commitment for financial decisions or state-changing operations
- **NEVER** ignore `simulateTransaction` errors — they indicate the transaction will fail on-chain
- **NEVER** use public RPC endpoints for production dApps — they will rate-limit you
- **ALWAYS** set `maxSupportedTransactionVersion: 0` when fetching transactions or blocks
- **ALWAYS** handle blockhash expiration with retry logic
- **ALWAYS** verify account ownership before trusting account data (check the `owner` field)
- **ALWAYS** use `confirmed` or `finalized` commitment for user-facing data

## References
- [Solana RPC HTTP Methods](https://solana.com/docs/rpc/http)
- [Solana RPC WebSocket Methods](https://solana.com/docs/rpc/websocket)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Clusters](https://solana.com/docs/references/clusters)
- [SPL Token Program](https://spl.solana.com/token)
