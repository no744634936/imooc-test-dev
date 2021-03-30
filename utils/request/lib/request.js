'use strict';



const axios= require('axios')

//imooc-cli-dev-semver 项目里的url
const BASE_URL= process.env.IMOOC_CLI_BASE_URL ? process.env.IMOOC_CLI_BASE_URL : 'http://zhanghaifeng.com:7001/'

const request = axios.create({
    baseURL:BASE_URL,
    timeout:7000,
})

console.log("request");
console.log(request);
module.exports = request;
