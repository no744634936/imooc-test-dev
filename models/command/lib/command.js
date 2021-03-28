'use strict';

//比对版本号的包
const semver=require("semver")
const colors=require("colors")
//有关日志的功能
const loger=require("@imooc-cli-dev-zhang/log")
const LOWEST_NODE_VERSION="13.0.0";


class Command{
    constructor(args){
        // console.log(args);
        this._args=args

        //不能什么都不传
        if(!args){
            throw new Error("参数不能为空！");
        }
        //参数必须为数组
        if(!Array.isArray(args)){
            throw new Error("参数必须为数组！");
        }
        // 不能只传一个空数组
        if(args.length<1){
            throw new Error("参数列表不能为空！");
        }
        // 微服务，同步代码执行完毕之后再执行
        let runner = new Promise((resolve,reject)=>{
            let chain = Promise.resolve();
            //因为 checke_node_version() 会抛出异常，所以要对异常做监听
            //const LOWEST_NODE_VERSION="100.0.0";
            //测试命令 imooc-test-dev  init projcet_name -tp /mnt/c/Users/zhang/Desktop/imooc-test/commands/init --debug --force
            chain = chain.then(()=>{this.checke_node_version()})
            chain= chain.then(()=>{this.initArgs()})
            chain= chain.then(()=>{this.init()})
            chain= chain.then(()=>{this.exec()})
            // 每新建一个promise的时候都要有一个try catch的逻辑，不方便trycatch的时候，就像这样用catch
            chain.catch(error=>{
                loger.error(error.message);
            })
        })
    }

    init(){
        throw new Error('init 必须实现')
    }

    exec(){
        throw new Error('exec 必须实现')
    }
    //检查node版本，项目中使用的api低版本的node可能是不支持的
    checke_node_version(){
        //获取当前node版本号
        const current_version=process.version;
        //设置最低版本号
        const lowest_version=LOWEST_NODE_VERSION
        // 当前版本号不大于最低版本号，抛异常
        if(!semver.gte(current_version,lowest_version)){
            throw new Error(colors.red(`imooc-cli 需要安装v${lowest_version}以上版本的node.js`))
        }
    }

    //初始化参数
    initArgs(){
        //_args 的最后一个元素
        this._cmd=this._args[this._args.length-1];
        this._args=this._args.slice(0,this._args.length-1)
        // console.log(this._cmd);
        // console.log("-----------");
        // console.log(this._args);
    }
}

module.exports = Command;