'use strict';
const axios=require("axios");
const url_join=require("url-join")
const semver=require("semver")

// 获取npm上发布的包的所有数据
function get_npm_package_info(npm_name,api_url) {
    if(!npm_name){
        return null;
    }
    const npm_api_url=api_url || get_default_api_url();
    const npm_info_url=url_join(npm_api_url,npm_name);   //https://registry.npmjs.org/@imooc-cli-dev-zhang/core
    return axios.get(npm_info_url).then(response=>{
        if(response.status===200){
            return response.data
        }else{
            return null
        }
    }).catch(err=>{
        //发生错误之后为什么会有这句代码，什么意思？
        return Promise.reject(err)
    })
}

function get_default_api_url(isOriginal=false){
    //用来获取传到npm上的包的版本信息，一个淘宝的源，一个国外的源
    return isOriginal ?  'https://registry.npmjs.taobao.org' : 'https://registry.npmjs.org';
}


//获取npm上发布的包的所有版本号
async function get_npm_package_versions(npm_name,api_url){
    const data=await get_npm_package_info(npm_name,api_url)
    if(data){
        return Object.keys(data.versions)
    }else{
        return []
    }
}

//现在的版本号跟npm上面的包的版本号作对比，看是否有版本更新
function get_semver_versions(base_version,all_versions){
    let bigger_versions=all_versions.filter(version=>{
        //all_versions 里的版本号要大于base_version
        return semver.satisfies(version,`^${base_version}`)
    }).sort((a,b)=>{
        //做个倒叙排列
        if(semver.gt(a,b)){
            return -1
        }
    })
    return bigger_versions;
}

async function get_bigest_versions(npm_name,base_version,api_url){
    
    const all_versions= await get_npm_package_versions(npm_name,api_url)
    const bigger_versions=get_semver_versions(base_version,all_versions)

    // 为什么要这样写if(bigger_versions && bigger_versions.length>0)
    //  只写if(bigger_versions)是不对的，因为当bigger_versions是有个空数组时，也是true
    if(bigger_versions && bigger_versions.length>0){
        let bigest_version=bigger_versions[0]
        return　 bigest_version
    }
}



module.exports = {
    get_npm_package_info,
    get_npm_package_versions,
    get_bigest_versions
};