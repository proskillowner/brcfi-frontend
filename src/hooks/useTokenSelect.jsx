import React, { useEffect, useReducer, useState, useRef } from "react";
import { getBalanceApi, getWhitelistApi, poolTokenListApi, tokenListApi } from "../utils/apiRoutes";
import useFetch from "./useFetch";
import { defaultToken, isStringEqual } from "../utils/constants";


export function useTokenSelect(address) {

  const [tokenOne, setTokenOne] = useState(null);
  const [tokenTwo, setTokenTwo] = useState(null);
  const [tokenList, fetchTokenList] = useFetch(address != undefined? tokenListApi + address : tokenListApi, { method: 'get' })
  const [poolTokenList, fetchPoolTokenList] = useFetch(address != undefined? poolTokenListApi + address : poolTokenListApi, { method: 'get' })
  const [poolTokenLists, setPoolTokenLists] = useState([])
  const [tokenSelectList, setTokenSelectList] = useState([[], [], []]);
  
  // Declare arrayAll and arrayPoolTokens as state variables
  const [arrayAll, setArrayAll] = useState([{ tick: "BTC", balance: 0}]);
  const [arrayPoolTokens, setArrayPoolTokens] = useState([{ tick: "BTC", balance: 0}]);

  useEffect(() => {
    setArrayAll(prev => [prev[0], ...tokenList])
    setArrayPoolTokens(prev => [prev[0], ...poolTokenList])
  }, [tokenList, poolTokenList])

  useEffect(() => {
    setTokenOne(arrayAll[0])
  }, [])

  useEffect(() => {
    const getBalance = async() => {
      const bal = await window.unisat.getBalance()
      setArrayAll(prevArray => {
        prevArray[0].balance = bal.confirmed / 1e8;
        return [...prevArray];
      });
      setArrayPoolTokens(prevArray => {
        prevArray[0].balance = bal.confirmed / 1e8;
        return [...prevArray];
      });
    }
    if (address != undefined && address){
      getBalance()
      fetchPoolTokenList()
      fetchTokenList()  
    }
  }, [address])

  useEffect(() => {
    let array = [];
    let array2 = [];

    array.push(arrayAll.filter((token) => !isStringEqual(token, tokenTwo)))
    array.push(arrayAll.filter((token) => !isStringEqual(token, tokenOne)))

    array2.push(arrayPoolTokens.filter((token) => !isStringEqual(token, tokenTwo)))
    array2.push(arrayPoolTokens.filter((token) => !isStringEqual(token, tokenOne)))

    setTokenSelectList([...array]);
    setPoolTokenLists([...array2]);
  }, [tokenOne, tokenTwo, arrayAll, arrayPoolTokens])

  useEffect(() => {
    if(tokenOne){
      const res = (arrayAll.filter((token) => isStringEqual(token, tokenOne)))
      setTokenOne(res[0])
    }
    if(tokenTwo){
      const res = (arrayAll.filter((token) => isStringEqual(token, tokenTwo)))
      setTokenTwo(res[0])
    }
  },[arrayAll])

  return [tokenList, tokenSelectList, poolTokenLists, tokenOne, tokenTwo, setTokenOne, setTokenTwo]
}
