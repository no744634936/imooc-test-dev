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
const Package=require("@imooc-cli-dev-zhang/package")
const {spinner_start,sleep}=require("@imooc-cli-dev-zhang/utils")
const path=require('path')
const userHome=require('user-home')
const semver=require('semver')
const fs=require('fs')
const fse=require('fs-extra')
const inquirer=require('inquirer')
const TYPE_PROJECT='project';
const TYPE_COMPONENT='component';
const get_project_template=require('./get_project_template.js')

class InitCommand extends Command{
    init(){
        //参数的初始化
        // 这参数是从 Command 继承过来的
        this.projectName=this._args[0] || "";
        this.force= this._args[1].force ? true : false;
        loger.verbose("project name",this.projectName)
        loger.verbose("force",this.force)
        
    }

    //init的业务逻辑
    async exec(){
        console.log("init的业务逻辑");
        //  虽然 cli/bin/cli.js 文件里有全局的try catch，但是为了更好的复用，还是要加try catch
        try{
            //1, 准备阶段
            const project_info=await this.prepare();

            // if(project_info) null and undefined check
            if(project_info){
                //2, 下载模板
                loger.verbose('project info',project_info)
                this.project_info=project_info;
                await this.download_template();
                //3, 安装模板
            }

        }catch(e){
            loger.verbose(e)
            loger.error(e.message)
        }
    }

    async prepare(){
        // 0 ,判断项目模板是否存在
        const template=await get_project_template();
        if(!template || template.length===0){
            throw new Error('项目模板不存在')
        }
        loger.verbose('template_info',template)
        this.template=template;
        //1,判断当前目录是否为空
        // 再 desktop上建一个文件夹，desktop/test
        // 然后cd 到 desktop/test文件夹里去
        // 执行命令 imooc-test-dev  init projcet_name -tp /mnt/c/Users/zhang/Desktop/imooc/imooc-test/commands/init --debug
        // 这里的process.cwd(); 表示的就是工作目录 desktop/test 文件夹
        // path.resolve('.') 表示的也是desktop/test 文件夹
        // 但是 console.log(__dirname); 就会显示为 /mnt/c/Users/zhang/Desktop/imooc-test/commands/init/lib
        // __dirname表示的是这个正在执行的文件所在的文件夹

        const local_path=process.cwd();

        // 测试命令
        // imooc-test-dev  init projcet_name -tp /mnt/c/Users/zhang/Desktop/imooc/imooc-test/commands/init --debug 
        // 如果没有--force 就执行两次确认

        // imooc-test-dev  init projcet_name -tp /mnt/c/Users/zhang/Desktop/imooc/imooc-test/commands/init --debug --force
        // 如果有--force 就只执行第两次确认

        if(!this.cwd_is_empty(local_path)){
            let flag=false;
            //如果命令中没有写入 --force参数，那么就执行这段代码
            if(!this.force){
                // 如果desktop/test文件夹里有文件，不为空询问是否继续创建
                const answer=await inquirer.prompt({
                    type:'confirm',
                    name:'ifcontinue',
                    default:"false",
                    message:'当前文件夹不为空，是否继续创建项目？'
                })
                flag=answer.ifcontinue;
                //当用户在这一步选择了否，就不往下执行代码了
                if(!flag){ return }
            }

            // 如果 answer.ifcontinue 为true 。启动强制更新
            if(flag || this.force){
                //给用户做二次确认
                const clear_folder=await inquirer.prompt({
                    type:'confirm',
                    name:'confirm_delete',
                    default:"false",
                    message:'确定清空当前目录下的文件'
                })
                if(clear_folder.confirm_delete){
                    //清空当前目录
                    fse.emptyDirSync(local_path);
                }
            }

        }
        //3,选中创建项目或者组件
        //4,获取项目的基本信息
        // return 项目的基本信息
        return this.get_project_info();
    }
    cwd_is_empty(local_path){
        // 读取desktop/test 文件夹里的文件列表，是一个数组
        let  file_list = fs.readdirSync(local_path)
        // 文件过滤的逻辑
        file_list=file_list.filter(file=>{
            // 文件名不以.开头，并且不是node_modules
           return !file.startsWith('.') && ['node_modules'].indexOf(file)<0
        })
        // console.log(file_list);
        // file_list 不存在或者 file_list.length<=0;
        return !file_list || file_list.length<=0
    }

    

   async get_project_info(){
        const {type}=await inquirer.prompt({
            type:'list',
            name:'type',
            default:TYPE_PROJECT,
            message:'请选择初始化的类型',
            choices:[{name:'项目',value:TYPE_PROJECT},{name:'组件',value:TYPE_COMPONENT}]
        })
        loger.verbose("init type",type)

        let project_info={};
        const title = type === TYPE_PROJECT ? '项目' : '组件';

        //这个方法不能写在class里面去。写到clas里去setTimeout的callback函数里就使用不了
        function isValidName(v) {
            return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v);
        }

        if(type===TYPE_PROJECT){
            const project =await inquirer.prompt([{
                type:'input',
                name:'project_name',
                default:'',
                message:'请输入项目名称',
                validate:function(v){
                    //1,首字符必须为英文字符
                    //2,尾字符必须为英文或数字，不能为其他字符
                    //3，字符仅允许 '-_'
                    //合法: a, a-b , a_b , a-b-c , a_b_c ,a-b1-c1, a_b1_c1
                    //不合法: 1, a_, a-,a_1,a-1
                    
                    //这段代码是inquirer提供的代码，如果输错了，会提醒错误信息
                    const done = this.async();
                    setTimeout(function() {
                      if (!isValidName(v)) {
                        done(`请输入合法的${title}名称`);
                        return;
                      }
                      done(null, true);
                    }, 0);
                },
                filter:function(v){return  v}
            },
            {
                type:'input',
                name:'project_version',
                default:'1.0.0',
                message:'请输入项目版本号',
                validate:function(v){
                    // !!将semver.valid(v) 返回的 null，1.0.0转化为布尔值
                    const done = this.async();
                    setTimeout(function() {
                      if (!(!!semver.valid(v))) {
                        done('请输入合法的版本号');
                        return;
                      }
                      done(null, true);
                    }, 0);
                },
                //这个filter的意义何在？
                filter:function(v){
                    if (!!semver.valid(v)) {
                        return semver.valid(v);
                        } else {
                        return v;
                    }
                }
            },
            {
                type:'list',
                name:'project_template',
                default:'1.0.0',
                message:'选择项目模板',
                choices:this.create_template_choice(),
            }
        ])
            project_info={
                type,
                ...project,
            }
        }else if(type===TYPE_COMPONENT){
            console.log("test");
        }

        return project_info;
    }

    create_template_choice(){
        return this.template.map(item=>{
            return {name:item.name,value:item.npmName}
        })
    }

    async download_template(){
        //1,通过项目模板api获取项目模板信息
        //project_info 是用户输入的信息，
        // template是mongodb里的模板信息
        // console.log('project_info',this.project_info);
        // console.log('template',this.template);

        console.log('userhome',userHome);
        const {project_template}=this.project_info
        const user_select_template_info=this.template.find(item=>item.npmName===project_template)
    
        //建立两个文件夹
        // /home/zhang/.imooc-cli-dev/template
        // /home/zhang/.imooc-cli-dev/template/node_modules
        const target_path=path.resolve(userHome,'.imooc-cli-dev','template')
        const store_dir=path.resolve(userHome,'.imooc-cli-dev','template','node_modules')

        const {npmName,version} = user_select_template_info
        const template_npm=new Package({target_path,store_dir,package_name:npmName,package_version:version})

        console.log(target_path,store_dir,npmName,version,template_npm);

        //判断/home/zhang/.imooc-cli-dev/template/node_modules里面是否有npmName所指代的包
        // npmName所指代的是imooc-cli-dev-template-vue3
        if(!await template_npm.exists()){
            //下载模板 imooc-cli-dev-template-vue3 到 /home/zhang/.imooc-cli-dev/template/node_modules
            const spinner= spinner_start('正在下载模板...')
            await sleep(1000)
            try{
                //有时install出了问题spinner就会一直转动，必须让他停止
                await template_npm.install();
                loger.success('下载模板成功')
            }catch(e){
                throw e
            }finally{
                spinner.stop(true)
            }
        }else{
            const spinner= spinner_start('正在更新模板...')
            await sleep(1000)
            try{
                //有时install出了问题spinner就会一直转动，必须让他停止
                await template_npm.update();
                loger.success('更新模板成功')
            }catch(e){
                throw e
            }finally{
                spinner.stop(true)
            }
        }
        //1.1 通过egg.js搭建一套后端系统
        //1.2 通过npm储存项目模板
        //1.3 将项目模板信息储存到mongodb数据库中
        //1.4 通过egg.js 获取mongodb数据库中的数据并通过api返回
    }

}


function init(args){
    return new InitCommand(args);
}
module.exports=init;
module.exports.InitCommand = InitCommand;
