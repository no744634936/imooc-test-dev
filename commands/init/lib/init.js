'use strict';


// 初始化方法？ 初始化的具体内容我还不知道
// function init(args){
// // imooc-cli-dev  init projcet_name -f -tp /xx/YY  
// // 这个命令中-f 是init 命令中的opiton，可以通过cmdObj 获取
// // -tp是全局option 得通过  options.parent._optionValues.targetPath 获取
// // console.log('init',projectName,cmdObj,options.parent._optionValues.targetPath);
// // 但是嵌套得子命令下那不到parent._optionValues，所以要使用监听命令获取targetPath 并放入环境变量中
//     let projcet_name=args[0];
//     let options=args[1];

//     console.log('init',projcet_name,options,process.env.CLI_TARGET_PATH);
    
// }

const Command=require("@imooc-cli-dev-zhang/command")
const loger=require("@imooc-cli-dev-zhang/log")

class InitCommand extends Command{
    init(){
        //参数的初始化
        // 这参数是从 Command 继承过来的
        this.projectName=this._args[0] || "";
        this.force= this._args[1].force ? true : false;
        // console.log(this.projectName);
        // console.log(this.force);
        loger.verbose("project name",this.projectName)
        loger.verbose("force",this.force)
        
    }

    //init的业务逻辑
    exec(){
        console.log("init的业务逻辑");
    }
}


function init(args){
    return new InitCommand(args);
}
module.exports=init;
module.exports.InitCommand = InitCommand;
