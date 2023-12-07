const express = require('express')
const parser = require('body-parser')
const cors = require('cors')

const {
  VAULT_ADDRESS,
  FRONT_SERVER,
  CREATE_POOL_STATIC_FEE,
  CREATE_POOL_DYNAMIC_FEE,
  ADD_LIQUIDITY_STATIC_FEE,
  ADD_LIQUIDITY_DYNAMIC_FEE,
  REMOVE_LIQUIDITY_STATIC_FEE,
  REMOVE_LIQUIDITY_DYNAMIC_FEE,
  SWAP_STATIC_FEE,
  SWAP_DYNAMIC_FEE,
  BTC_TOKEN,
  NATIVE_TOKEN,
} = require('./config.js')

const {
  balanceCollection,
} = require('./global.js')

const {
  compareStringCaseInsensitive,
} = require('./util.js')

const {
  getPoolInfo0,
  getPoolInfo1,
  getPoolInfo2,
} = require('./core/factory.js')

const {
  getPoolBalance,
  calculateTokenAmountForAddLiquidity,
  calculateTokenAmountForRemoveLiquidity,
  calculateTokenAmountForSwap,
} = require('./core/pool.js')

const {
  getTokenBalance,
  getTokenList,
  getTokenInfo,
} = require('./core/brc20-indexer.js')

const {
  getOrders,
  orderCreatePool,
  orderAddLiquidity,
  orderRemoveLiquidity,
  orderSwap,
  orderMintToken,
} = require('./core/orderbook.js')

////////////////////////////////////////////////////////////////

const ERROR_UNKNOWN = "Unknown error"
const ERROR_INVALID_PARAMETER = 'Invalid parameter'
const ERROR_INVALID_TOKEN_NAME = 'Invalid token name'
const ERROR_INVALID_LP_TOKEN = "Invalid LP token"
const ERROR_TOKEN_NOT_EXIST = 'Token not exist'
const ERROR_POOL_NOT_EXIST = 'Pool not exist'
const ERROR_POOL_ALREADY_EXIST = 'Pool already exist'
const ERROR_INVALID_BTC_POOL = `${BTC_TOKEN} can be only paired with ${NATIVE_TOKEN}`

const server = express()

server.use(parser.urlencoded({ extended: false }))
server.use(parser.json())

server.use(cors())

////////////////////////////////////////////////////////////////

server.get('/tokenlist', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const tokenList = await getTokenList()

    res.send(JSON.stringify({ status: 'success', data: tokenList }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.get('/tokeninfo/:token', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const token = req.params.token

    if (!compareStringCaseInsensitive(token, BTC_TOKEN) && token.length != 4) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    const tokenInfo = await getTokenInfo(token)

    if (tokenInfo) {
      res.send(JSON.stringify({ status: 'success', data: tokenInfo }))
    } else {
      res.send(JSON.stringify({ status: 'error', description: ERROR_TOKEN_NOT_EXIST }))
    }
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.get('/gettokenbalance/:token/:address', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const address = req.params.address
    const token = req.params.token

    if (!compareStringCaseInsensitive(token, BTC_TOKEN) && token.length != 4) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    const tokenBalance = await getTokenBalance(token, address)

    res.send(JSON.stringify({ status: 'success', data: tokenBalance }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.get('/getbtcbalance/:address', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const address = req.params.address

    const balances = await balanceCollection.find({ address }).toArray()
    let btcBalance = 0

    for (const balance of balances) {
      btcBalance += balance.balance
    }

    res.send(JSON.stringify({ status: 'success', data: btcBalance }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.get('/getbtcbalances/:address', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const address = req.params.address

    const balances = await balanceCollection.find({ address }).toArray()

    res.send(JSON.stringify({ status: 'success', data: balances }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.get('/getpool', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const poolInfo = await getPoolInfo0()

    res.send(JSON.stringify({ status: 'success', data: poolInfo }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.get('/getpool/:token', async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const token = req.params.token

    if (!compareStringCaseInsensitive(token, BTC_TOKEN) && token.length != 4) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    const poolInfo = await getPoolInfo1(token)

    res.send(JSON.stringify({ status: 'success', data: poolInfo }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.get('/getpool/:token1/:token2', async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const token1 = req.params.token1
    const token2 = req.params.token2

    if (!compareStringCaseInsensitive(token1, BTC_TOKEN) && token1.length != 4
      || !compareStringCaseInsensitive(token2, BTC_TOKEN) && token2.length != 4) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    const poolInfo = await getPoolInfo2(token1, token2)

    if (!poolInfo) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_POOL_NOT_EXIST }))
      return
    }

    poolInfo.balance1 = await getPoolBalance(token1, poolInfo.address)
    poolInfo.balance2 = await getPoolBalance(token2, poolInfo.address)

    res.send(JSON.stringify({ status: 'success', data: poolInfo }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.get('/getvaultaddress', async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    res.send(JSON.stringify({ status: 'success', data: VAULT_ADDRESS }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.get('/getfee', async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    res.send(JSON.stringify({
      status: 'success',
      data: {
        create_pool_static_fee: CREATE_POOL_STATIC_FEE,
        create_pool_dynamic_fee: CREATE_POOL_DYNAMIC_FEE,
        add_liquidity_static_fee: ADD_LIQUIDITY_STATIC_FEE,
        add_liquidity_dynamic_fee: ADD_LIQUIDITY_DYNAMIC_FEE,
        remove_liquidity_static_fee: REMOVE_LIQUIDITY_STATIC_FEE,
        remove_liquidity_dynamic_fee: REMOVE_LIQUIDITY_DYNAMIC_FEE,
        swap_static_fee: SWAP_STATIC_FEE,
        swap_dynamic_fee: SWAP_DYNAMIC_FEE,
      },
    }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.post('/getorders', async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const orders = await getOrders(req.body)

    res.send(JSON.stringify({ status: 'success', data: orders }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.post('/depositbtc', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const depositAddress = req.body.deposit_address
    const depositTxid = req.body.deposit_txid

    res.send(JSON.stringify({ status: 'success', data: null }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.post('/withdrawbtc', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    const withdrawAddress = req.body.withdraw_address
    const withdrawAmount = req.body.withdraw_amount

    res.send(JSON.stringify({ status: 'success', data: null }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

function checkTokenPairName(token1, token2, lpToken) {
  return (
    compareStringCaseInsensitive(token1, BTC_TOKEN) || token1.length == 4 &&
    compareStringCaseInsensitive(token2, BTC_TOKEN) || token2.length == 4 &&
    lpToken.length == 4 &&
    !compareStringCaseInsensitive(token1, token2) &&
    !compareStringCaseInsensitive(token1, lpToken) &&
    !compareStringCaseInsensitive(token2, lpToken)
  )
}

function checkSignedRequest(request) {
  return request.sender_address && request.fee_txid && request.fee_rate
}

server.post('/createpool', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'POST')

    const order = req.body

    if (!checkSignedRequest(order) || !order.token1 || !order.token2 || !order.lp_token || !order.lp_token_max_supply) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
      return
    }

    if (!checkTokenPairName(order.token1, order.token2, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    if (compareStringCaseInsensitive(order.token1, BTC_TOKEN) && compareStringCaseInsensitive(order.token2, NATIVE_TOKEN) ||
      compareStringCaseInsensitive(order.token2, BTC_TOKEN) && compareStringCaseInsensitive(order.token1, NATIVE_TOKEN)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_BTC_POOL }))
      return
    }

    const poolInfo = await getPoolInfo2(order.token1, order.token2)

    if (poolInfo) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_POOL_ALREADY_EXIST }))
      return
    }

    await orderCreatePool(order)

    res.send(JSON.stringify({ status: 'success' }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.post('/addliquidity/tokenamount', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'POST')

    const order = req.body

    if (!order.token1 || !order.token2 || !order.lp_token || !order.token_amount1 || !order.token_amount2) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
      return
    }

    if (!checkTokenPairName(order.token1, order.token2, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    const poolInfo = await getPoolInfo2(order.token1, order.token2)

    if (!poolInfo) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_POOL_NOT_EXIST }))
      return
    }

    if (!compareStringCaseInsensitive(poolInfo.lp_token, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_LP_TOKEN }))
      return
    }

    order.pool_address = poolInfo.address

    await calculateTokenAmountForAddLiquidity(order)

    res.send(JSON.stringify({ status: 'success', data: order }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.post('/addliquidity', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'POST')

    const order = req.body

    if (!checkSignedRequest(order) || !order.token1 || !order.token2 || !order.lp_token || !order.token_amount1 || !order.token_amount2) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
      return
    }

    if (!checkTokenPairName(order.token1, order.token2, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    const poolInfo = await getPoolInfo2(order.token1, order.token2)

    if (!poolInfo) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_POOL_NOT_EXIST }))
      return
    }

    if (!compareStringCaseInsensitive(poolInfo.lp_token, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_LP_TOKEN }))
      return
    }

    order.pool_address = poolInfo.address

    await orderAddLiquidity(order)

    res.send(JSON.stringify({ status: 'success' }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.post('/removeliquidity/tokenamount', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'POST')

    const order = req.body

    if (!order.token1 || !order.token2 || !order.lp_token || !order.lp_token_amount) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
      return
    }

    if (!checkTokenPairName(order.token1, order.token2, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    const poolInfo = await getPoolInfo2(order.token1, order.token2)

    if (!poolInfo) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_POOL_NOT_EXIST }))
      return
    }

    if (!compareStringCaseInsensitive(poolInfo.lp_token, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_LP_TOKEN }))
      return
    }

    order.pool_address = poolInfo.address

    await calculateTokenAmountForRemoveLiquidity(order)

    res.send(JSON.stringify({ status: 'success', data: order }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.post('/removeliquidity', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'POST')

    const order = req.body

    if (!checkSignedRequest(order) || !order.token1 || !order.token2 || !order.lp_token || !order.lp_token_amount) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
      return
    }

    if (!checkTokenPairName(order.token1, order.token2, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    const poolInfo = await getPoolInfo2(order.token1, order.token2)

    if (!poolInfo) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_POOL_NOT_EXIST }))
      return
    }

    if (!compareStringCaseInsensitive(poolInfo.lp_token, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_LP_TOKEN }))
      return
    }

    order.pool_address = poolInfo.pool_address

    await orderRemoveLiquidity(order)

    res.send(JSON.stringify({ status: 'success' }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.post('/swap/tokenamount', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'POST')

    const order = req.body

    if (!order.in_token || !order.out_token || !order.lp_token || !order.in_token_amount) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
      return
    }

    if (!checkTokenPairName(order.in_token, order.out_token, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    const poolInfo = await getPoolInfo2(order.in_token, order.out_token)

    if (!poolInfo) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_POOL_NOT_EXIST }))
      return
    }

    if (!compareStringCaseInsensitive(poolInfo.lp_token, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_LP_TOKEN }))
      return
    }

    order.pool_address = poolInfo.pool_address

    await calculateTokenAmountForSwap(order)

    res.send(JSON.stringify({ status: 'success', data: order }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.post('/swap', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'POST')

    const order = req.body

    if (!checkSignedRequest(order) || !order.in_token || !order.out_token || !order.lp_token || !order.in_token_amount) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
      return
    }

    if (!checkTokenPairName(order.in_token, order.out_token, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    const poolInfo = await getPoolInfo2(order.in_token, order.out_token)

    if (!poolInfo) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_POOL_NOT_EXIST }))
      return
    }

    if (!compareStringCaseInsensitive(poolInfo.lp_token, order.lp_token)) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_LP_TOKEN }))
      return
    }

    order.pool_address = poolInfo.address

    await orderSwap(order)

    res.send(JSON.stringify({ status: 'success' }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

server.post('/minttoken', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
    res.setHeader('Access-Control-Allow-Methods', 'POST')

    const order = req.body

    if (!checkSignedRequest(order) || !order.token || !order.token_max_supply) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
      return
    }

    if (order.token.length != 4) {
      res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
      return
    }

    await orderMintToken(order)

    res.send(JSON.stringify({ status: 'success' }))
  } catch (error) {
    console.error(error)
    res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
  }
})

module.exports = {
  server,
}
