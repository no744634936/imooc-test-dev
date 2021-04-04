'use strict';
const {isObject}=require("@imooc-cli-dev-zhang/utils")
const pkg_dir=require("pkg-dir").sync
const path=require("path");
const formatPath=require("@imooc-cli-dev-zhang/format-path")
const {get_default_api_url,get_package_latest_version}=require("@imooc-cli-dev-zhang/get-npm-info")
const npm_install=require("npminstall"); //这是一个异步函数
const path_exists=require("path-exists").sync
const fse=require("fs-extra")

class Package {
    constructor(options){
        if(!options){
            throw new Error('Package 类的初始化参数options不能为空')
        }

        //因为[]也是object 所以要用Object.prototype.toString.call() 方法来判断是否为对象
        if(!isObject(options)){
            throw new Error('Package 类的初始化参数options必须为object')
        }
        //本地package的路径，当不传的时候表示的是这个package不是本地的
        this.target_path=options.target_path
        //缓存package的路径.就是在target_path后面加一个node_modules
        this.storeDir=options.store_dir
        //package name
        this.package_name=options.package_name;
        //package version
        this.package_version=options.package_version;

        //package的缓存目录前缀
        //将package_name 改为 _@imooc-cli_init 前缀
        this.cache_file_path_prefix=this.package_name.replace('/','_');

        
    }

   async prepare(){
       if(this.storeDir && !path_exists(this.storeDir)){
           //将storeDir这个路径上所有不存在的文件夹都建好
           //解决目录不存在的问题
           //做这个路径的所有文件夹 //home/zhang/.imooc-cli-dev/dependencies/node_modules
           fse.mkdirpSync(this.storeDir)
       }

       // 获得package的最新版本
        if(this.package_version==='latest'){
            this.package_version=await get_package_latest_version(this.package_name)
        }
    }

    //也可以不要这个 get 但是下面的path_exists(this.cache_file_path) 就要改成path_exists(cache_file_path());
   // 拼出一个这样的缓存路径 /home/zhang/.imooc-cli-dev/dependencies/node_modules/_@imooc-cli_init@1.1.2@@imooc-cli/init
    get cache_file_path(){
        return path.resolve(this.storeDir,`_${this.cache_file_path_prefix}@${this.package_version}@${this.package_name}`)
    }

    //exists判断package（init package） 是否在home/zhang/.imooc-cli-dev/dependencies/node_modules 这个目录下
    async exists(){
        // 缓存模式
        // 如果package是在 home/zhang/.imooc-cli-dev/dependencies/node_modules 这个目录下
        if(this.storeDir){
            await this.prepare();
            //拼出下面这样一个路径，然后去找这样一个路径是否存在，如果存在就更新这个路径里的package
            //home/zhang/.imooc-cli-dev/dependencies/node_modules/_@imooc-cli_init@1.1.2@@imooc-cli/init
            return path_exists(this.cache_file_path)

        }else{
            // 输入的 target_path是存在的。
            return path_exists(this.target_path)
        }
    }

    //安装package
    // 这个方法的测试命令是imooc-test-dev init test_projcet_name --debug --force
    async install(){
        //安装的是最新版本
        await this.prepare();
        // 因为npm_install是promise 对象所以要return出去
       return  npm_install({
            root: this.target_path,  ///home/zhang/.imooc-cli-dev/dependencies
            storeDir: this.storeDir, ///home/zhang/.imooc-cli-dev/dependencies/node_modules
            // optional packages need to install, default is package.json's dependencies and devDependencies
            pkgs: [
              { name: this.package_name, version: this.package_version },
            ],
            // registry, default is https://registry.npmjs.org
            registry: get_default_api_url(),
        })

    }

    get_specific_cache_file_path(package_version){
        return path.resolve(this.storeDir,`_${this.cache_file_path_prefix}@${package_version}@${this.package_name}`)
    }
    //更新package
    async update () {
        //安装的是最新版本
        await this.prepare();
        //1,获取最新的npm版本号
        const newest_version=await get_package_latest_version(this.package_name)
        //2,查询最新的版本号对应的路径是否存在
        const latest_version_file_path= this.get_specific_cache_file_path(newest_version)
        if(!path_exists(latest_version_file_path)){
            //3,如果不存在则直接安装最新版本
            await  npm_install({
                root: this.target_path,  ///home/zhang/.imooc-cli-dev/dependencies
                storeDir: this.storeDir, ///home/zhang/.imooc-cli-dev/dependencies/node_modules
                // optional packages need to install, default is package.json's dependencies and devDependencies
                pkgs: [
                  { name: this.package_name, version: newest_version },
                ],
                // registry, default is https://registry.npmjs.org
                registry: get_default_api_url(),
            })
            this.package_version=newest_version;
        }

    }

    //获取commands/init 这个包的入口文件的路径
    
    get_root_file_path(){
        function _get_root_file(target){
            const dir=pkg_dir(target)
            if(dir){
                //2,读取package.json
                const package_json_file=require(path.resolve(dir,'package.json'));
                //3,找到main
                if(package_json_file && package_json_file.main){
                    //返回入口文件路径  /mnt/c/Users/zhang/Desktop/imooc-test/commands/init/lib/init.js
                    let entry_file_path=path.resolve(dir,package_json_file.main);
                    //4,路径的兼容 （linux,window）
                    return formatPath(entry_file_path)
                }
            }
            return null; //表示路径不存在
        }
        
        if(this.storeDir){
            //使用缓存的情况，缓存指的是
            // /home/zhang/.imooc-cli-dev/dependencies/node_modules/_@imooc-cli_init@1.1.2@@imooc-cli/init 
            //这个文件
            //测试命令 imooc-test-dev init test_projcet_name --debug
            return _get_root_file(this.cache_file_path)

        }else{
            //不使用缓存的情况
            //1,获取package.json文件所在的文件夹，pkg-dir
            // 测试命令 
            //imooc-test-dev  init projcet_name -tp /mnt/c/Users/zhang/Desktop/imooc/imooc-test/commands/init --debug
            //imooc-test-dev  init projcet_name -tp /mnt/c/Users/zhang/Desktop/imooc/imooc-test/commands/init/lib --debug
            // Find the root directory of a Node.js project or npm package
             //不管target_path是上面的哪一个返回的都是init文件夹
             return _get_root_file(this.target_path)
        }
    }
}


module.exports=Package

