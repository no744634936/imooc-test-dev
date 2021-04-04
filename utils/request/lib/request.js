'use strict';

const axios= require('axios')

//imooc-cli-dev-semver 项目里的url
const BASE_URL= process.env.IMOOC_CLI_BASE_URL ? process.env.IMOOC_CLI_BASE_URL : ' https://api.mocki.io';
console.log('BASE_URL',BASE_URL);

//7秒钟之内得不到请求就断开并抛出异常
const request = axios.create({
    baseURL:BASE_URL,
    timeout:7000,
})

// 返回数据的拦截器，axios 返回的数据很多，我只要response.data 
request.interceptors.response.use(
    response=>{
        console.log(response.data);
        return response.data;
        
    },
    error=>{
        console.log(error);
        return Promise.reject(error)
    }
)


module.exports = request;
