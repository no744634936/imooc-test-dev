#!/usr/bin/env node
const importLocal= require("import-local");

// 当在imooc-cli-dev-2 文件夹中执行 npm install @imooc-cli-dev-zhang/core -D 之后
// (与core文件夹同一层级的node_modules里面如果有出現一個@imooc-cli-dev-zhang/core包，不知为什么我这里没有出现那个包)
// 执行 imooc-cli-dev  命令importLocal(__filename) 就会返回true
// 与core文件夹同一层级的node_modules里面如果有出現一個@imooc-cli-dev-zhang/core包的代码就会被执行
// 然后执行 require("npmlog").info("cli","正在使用imooc-cli 本地版本")
// importLocal(__filename)优先使用本地node_modules里面的imooc-cli-dev命令
// 以后测试的时候要用到
// console.log(importLocal(__filename));

if(importLocal(__filename)){
    //打印日志
    require("npmlog").info("cli","正在使用imooc-cli 本地版本")
}else{
    const core=require("../lib/cli.js")
    core()
}