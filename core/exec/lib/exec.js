'use strict';
const Package= require('@imooc-cli-dev-zhang/package')
const loger=require("@imooc-cli-dev-zhang/log")
const path=require("path")
const cp =require("child_process")

module.exports = exec;

//根据不同的团队，调用不同的init包，可以提高cli的可扩展性
// init ,my_init,your_init 布局init的命令不同拿到不同的init包
const SETTINGS={
    init:"@imooc-cli/init"
}


// 测试命令
// imooc-test-dev  init projcet_name -tp /mnt/c/Users/zhang/Desktop/imooc-test/commands/init --debug --force
async function exec() {

    //判断是否为本地的链接
    let target_path=process.env.CLI_TARGET_PATH;
    let home_path=process.env.CLI_HOME_PATH;
    let store_dir="";

    //正式执行的时候不会打印，debug模式的时候才会打印。方便调试
    // -tp 就是 commands/init 的模块路径 C:\Users\zhang\Desktop\imooc-test\commands\init
    // linux 系统下的路径是 /mnt/c/Users/zhang/Desktop/imooc-test/commands/init
    //测试命令为 imooc-test-dev  init projcet_name -tp /mnt/c/Users/zhang/Desktop/imooc-test/commands/init --debug
    //这个targetpath 就是commands/init的文件夹路径 用pwd命令 获取
    loger.verbose('target_path',target_path)
    loger.verbose('home_path',home_path)

    // 这个arguments 参数是从cli.js文件传过来的。
    // console.log(arguments); 获得该命令所有的参数
    //获取到Command
    const cmd_obj=arguments[arguments.length-1];
    // console.log(cmd_obj.name()) // 获得的是init 
    // console.log(cmd_obj.parent._optionValues); //得到全局的option的值
    const cmd_name=cmd_obj.name();
    const package_name=SETTINGS[cmd_name];

    //默认为latest
    //我可以在这里指定要下载的版本，下载下来之后/dependencies/node_modules里面会显示'_@imooc-cli_init@1.1.2@@imooc-cli'
    // const package_version='1.1.0';
    const package_version='latest';

    
    // 测试命令imooc-test-dev init test_projcet_name --debug
    const CACHE_DIR="dependencies"
    let pkg;
    if(!target_path){
        //生成缓存路径
        target_path=path.resolve(home_path,CACHE_DIR);    //home/zhang/.imooc-cli-dev/dependencies
        store_dir=path.resolve(target_path,'node_modules');//home/zhang/.imooc-cli-dev/dependencies/node_modules
        loger.verbose('target_path',target_path)
        loger.verbose('store_dir',store_dir)
        // console.log(target_path,store_dir);
        pkg=new Package({
            target_path,
            store_dir,
            package_name,
            package_version
        });

        
        if(await pkg.exists()){
            // 如果target_path不存在
            //且当指定的package(init package)在home/zhang/.imooc-cli-dev/dependencies/node_modules 这个目录下的时候
            //更新package
            console.log("更新package");
            await pkg.update();
        }else{
            // 如果target_path不存在的时候
            //当指定的package(init package)在home/zhang/.imooc-cli-dev/dependencies/node_modules 这个目录也没有的时候
            // 测试的时候可以将"@imooc-cli-dev-zhang/init" 先改为一个npm上已经存在的库 init:"@imooc-cli-/init"，然后再执行测试命令
            // 安装 package
           // 它会将@imooc-cli-/init 这个包下载到 home/zhang/.imooc-cli-dev/dependencies/node_modules 这个目录下
            await pkg.install();
        }
    }else{
        //如果指定了target_path，就使用这个target_path下的本地的init包
        //也就没有必要传store_dir了
        pkg=new Package({
            target_path,
            package_name,
            package_version
        });
    }
    // console.log(await pkg.exists());
    const root_file=pkg.get_root_file_path();
    // console.log("root_file",root_file);
    // Array.from 将类数组转变为数组

    if(root_file){
        try{
            //  在cli.js 文件中虽然有try catch 
            // 但是 与promise有关的方法报的错需要在引用的时候单独捕获。在这里无法捕获


            // arguments 瘦身,删除一些不必要的属性
            const args=Array.from(arguments);
            // 创造一个没有原型链的对象，正真的空对象。
            const o=Object.create(null);
            const cmd=args[args.length-1];
            

            Object.keys(cmd).forEach(key=>{
                // 继承的原型链上的property就不要了
                // 以下划线开头的属性也不要了
                // parent属性也不要了
                if(cmd.hasOwnProperty(key) && !key.startsWith('_') && key!=='parent'){
                    o[key]=cmd[key]
                }
            })
            args[args.length-1]=o;

            //JSON.stringify是把js的对象转变为字符串，数据在传输的过程中只能传输字符串。
            const code=`require('${root_file}')(${JSON.stringify(args)})`;
            // 使用一个新的进程来执行 code
            // node -e code，表示让node执行这段代码
            // process.cwd() 的内容是这个，c:\Users\zhang\Desktop\imooc-test 为什么要用这个cwd呢？
            // stdio:'inherit',用这个比较方便
            const child=my_spawn('node',['-e',code],{
                cwd:process.cwd(),
                stdio:'inherit'
            })

            child.on('error',e=>{
                loger.error(e.message)
                process.exit(1);  //给一个错误的code，让程序中断执行
            })

            child.on('exit',e=>{
                loger.verbose('命令执行成功:'+e)   //这个e的code是0，表示成功
                process.exit(e);
            })
        }catch(e){
            loger.error(e.message)
        }
        
    }

}


//windows 跟Linux的平台的兼容
//linux 里spawn 使用node cp.spawn('node',['-e',code])
//windows 里spawn 使用node cp.spawn('cmd',['/c','node','-e',code])
function my_spawn(command,args,options){
    const win32= process.platform==="win32";
    const cmd= win32 ? 'cmd' : command;
    const cmd_args= win32 ? ['/c'].concat(command,args):args;

    // 如果没有options 就使用{}
    return cp.spawn(cmd,cmd_args,options || {}) 
}