'use strict';
const Package= require('@imooc-cli-dev-zhang/package')
const loger=require("@imooc-cli-dev-zhang/log")
const path=require("path")

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
    if(root_file){
        require(root_file)(arguments);
    }

}
