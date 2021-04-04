'use strict';

const loger=require("npmlog")
//npmlog 源码里有一个log.level 变量，默认等于'info',而info对应的level是2000，
//只有大于等于2000的方法调用后才能生效
//源码里的verbose方法就是调试的意思 verbose对应的level是1000
//debug模式的原理就是 让log.level ="verbose" 也就是level的下降
// 当输入 imooc-cli-dev --debug 的时候设定 log.level ="verbose" 就可以调试了
// 从环境变量中获取 LOG_LEVEL的值，

//判断是否为debug模式
loger.level=process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info"
// 对npmlog这个包添加自己喜欢的功能
loger.addLevel("success",2000,{fg:"green",bold:true})
//添加前缀
loger.heading="项目名imooc"

module.exports=loger