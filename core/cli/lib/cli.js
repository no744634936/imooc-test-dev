'use strict';

//内部包path
const path=require("path")
//检查版本号
const pkg=require("../package.json")
//有关日志的功能
const loger=require("@imooc-cli-dev-zhang/log")
//获取常量
const constants=require("./const.js")
//比对版本号的包
const semver=require("semver")
const colors=require("colors")
// //root 权限降级
// const root_check=require("root-check")
// //判断用户主目录
// const user_home=require("user-home")
// const path_exists=require("path-exists").sync;
// //检查输入参数的包，在checkInputArgs方法里使用
// // const minimist=require("minimist")
// const commander=require('commander')
// const init =require('@imooc-cli-dev-zhang/init')
// const exec =require('@imooc-cli-dev-zhang/exec')

module.exports = cli;

async function cli() {
    try{
        await prepare()
    }catch(e){
        loger.error(e.message)
    }

}


//脚手架启动阶段的方法
async function prepare(){
    check_page_version();
    checke_node_version()
}

//检查cli项目版本号
function check_page_version(){
    loger.info('cli',pkg.version)
}

//检查node版本，项目中使用的api低版本的node可能是不支持的
function checke_node_version(){
    //获取当前node版本号
    const current_version=process.version;
    //设置最低版本号
    const lowest_version=constants.LOWEST_NODE_VERSION
    // 当前版本号不大于最低版本号，抛异常
    if(!semver.gte(current_version,lowest_version)){
        throw new Error(colors.red(`imooc-cli 需要安装v${lowest_version}以上版本的node.js`))
    }
}


// 在linux系统里用sudo imooc-cli-dev
// 在linux系统用root账户创建的文件就属于root账户的，其他人就无法修改了
////检查是否是root权限登录，如果是的话就自动权限降级,这样用root账户建的文件别人也能修改
// windows 上面用不了这个方法
// function check_root(){
//     // console.log(process.geteuid()); root权限的process.geteuid() 为0
//     root_check();
// }