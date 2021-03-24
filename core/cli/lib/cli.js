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
const root_check=require("root-check")
//判断用户主目录
const user_home=require("user-home")
const path_exists=require("path-exists").sync;
const commander=require('commander')
const exec =require('@imooc-cli-dev-zhang/exec')

module.exports = cli;

async function cli() {
    try{
        await prepare()
    }catch(e){
        loger.error(e.message)
        if(process.env.LOG_LEVEL==="verbose"){
            //在debug模式下打印全部错误信息
            //if(program.debug)也可以
            console.log(e)
        }
    }

}

//脚手架启动阶段的方法
async function prepare(){
    check_page_version();
    checke_node_version();
    check_root();
    check_user_home();
    check_env();
    // await check_global_update();
    registerCommand();
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


// 在linux系统里用sudo imooc-test-dev
// 在linux系统用root账户创建的文件就属于root账户的，其他人就无法修改了
////检查是否是用root权限登录，如果是的话就自动权限降级,这样用root账户建的文件别人也能修改
// windows 上面用不了这个方法
function check_root(){
    // console.log(process.geteuid()); //root权限的process.geteuid() 为0
    root_check();
}

//检查用户主目录
//没有用户主目录缓存之类的好多事都做不了
function check_user_home(){
    // console.log(user_home);
    if(!user_home || !path_exists(user_home)){
        throw new Error(colors.red('当前登录用户主目录不存在'))
    }
}

//环境变量的检查与修改
//运行imooc-test-dev --debug命令的时候才会出动check_env方法 
function check_env(){
    //dotenv 包可以从.env文件加载环境变量，到process.env里去
    const dotenv= require("dotenv")
    //dotenv.config 默认是从当前文件夹lib里找，.env 文件
    //path.resolve(user_home,'.env') 的意思是去用户主目录C:\Users\zhang 里面找.env 文件
    const dotenv_path=path.resolve(user_home,'.env')
    if(path_exists(dotenv_path)){
        //.env文件里的变量，加载到process.env里去
        dotenv.config({path:dotenv_path})
    }
    //console.log(dotenv.config({path:dotenv_path}))
    //dotenv.config解析出来的是  parsed: { CLI_HOME: '.imooc-cli', DB_USER: 'root', DB_PWD: '123456' }

    //根据情况设置默认
    create_defalut_config()
    
    // loger.verbose("环境变量",process.env.CLI_HOME_PATH)
    
}

function create_defalut_config(){
    const cli_config={
        home:user_home,
    }
    //如果环境变量里面有 CLI_HOME 这个变量
    if(process.env.CLI_HOME){
        cli_config['cli_home']=path.join(user_home,process.env.CLI_HOME)
    }else{
    //如果环境变量里面没有 CLI_HOME 这个变量，就做一个默认的
        cli_config['cli_home']=path.join(user_home,constants.DEFAULT_CLI_HOME)
    }

    //做一个process.env.CLI_HOME_PATH 环境变量
    //这个有什么用呢？ 做个缓存目录
    process.env.CLI_HOME_PATH=cli_config.cli_home
    // console.log(process.env);
}

//脚手架更新提醒
async function check_global_update(){
    // 1,获取当前版本号与模块名(npm 包名)
    const current_version=pkg.version;
    const npm_name=pkg.name       //@imooc-test-dev-zhang/core
    // 2，调用npm api 获取版本号
    const {get_bigest_versions}=require("@imooc-cli-dev-zhang/get-npm-info");

    const bigest_version=await get_bigest_versions(npm_name,current_version)
    if(bigest_version && semver.gt(bigest_version,current_version)){
        loger.warn('版本检查',colors.yellow(`请手动更新${npm_name},当前的版本为${current_version},最版本为${bigest_version},更新命令: npm install -g ${npm_name}`))
    }else{
        loger.info('版本检查',colors.green(`当前版本为最新版本${current_version}`))
    }
    // console.log(bigest_version);
}



//注册命令
const program=new commander.Command()

function registerCommand(){
    //设置一些全局的参数,初始化
    //所有命令都可以用这几个option
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d,--debug','是否开启调试模式',false)
        .option('-tp,--targetPath <targetPath>','是否指定本地调试文件路径','')
        .exitOverride()   //如果像手动处理错误使用这个选项，

    //注册命令
    //  imooc-test-dev  init projcet_name -tp /mnt/c/Users/zhang/Desktop/imooc-test/commands/init --debug --force
    // 注意exec方法会接收到一些参数，可以用arguments 获得
    program
        .command('init [projcetName]')
        .option('-f,--force','是否强制初始化项目')
        .action(exec)


    //  imooc-test-dev  init projcet_name -f -tp /xx/YY  
    // 这个命令中-f 是init 命令中的opiton，可以通过cmdObj 获取
    // -tp是全局option 得通过  options.parent._optionValues.targetPath 获取
    // console.log('init',projectName,cmdObj,options.parent._optionValues.targetPath);
    // 但是嵌套得子命令下那不到parent._optionValues，所以要将监听命令获取targetPath 并放入环境变量中
    program
        .on('option:targetPath',()=>{
            // console.log(program.opts().targetPath);
            process.env.CLI_TARGET_PATH=program.opts().targetPath;
        })

    //監聽事件，实现debug模式
     //imooc-test-dev --debug  这种写法是错误得 要这样写imooc-test-dev init --debug
     // imooc-test-dev -d      这种写法是错误得 要这样写imooc-test-dev init --d
     //注意用到了this 不能用箭頭函數
     program
        .on('option:debug',()=>{
            if(program.opts().debug){
                process.env.LOG_LEVEL='verbose';
            }else{
                process.env.LOG_LEVEL='info';
            }
            loger.level=process.env.LOG_LEVEL
            loger.verbose('test')
        })

    //对未知的命令进行处理
    //imooc-cli-dev yooo
    program.on('command:*',(obj)=>{
        // console.log(obj);
        console.log(colors.red('未知的命令:'+obj[0]))
        const availableCommands=program.commands.map(cmd=>cmd.name())
        console.log(colors.red('可用命令:'+availableCommands.join(',')));
    })

    //只輸入 imooc-test-dev的時候，打印帮助文档
    if(process.argv.length<3){
        program.outputHelp();
        console.log();
    }else{
        //这个东西必须在最下方,解析参数
        try {
            // 解析命令
            program.parse(process.argv);
          } catch (err) {
            // 当命令输入不符合规范的时候，
            loger.error(err.message);
            // 遇到错误的时候打印帮助文档
            if (err.code === 'commander.unknownOption') {
              console.log();
              program.outputHelp();
            }
        }
    }
}