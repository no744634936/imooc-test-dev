'use strict';
const path=require("path");

module.exports = formatPath;

// linux 里的路径是/    window里的路径是 \
function formatPath(entry_file_path) {

    if(entry_file_path && typeof entry_file_path==='string'){
        //获得当前操作系统里的路径的分隔符
        const sep=path.sep;
        if(sep==='/'){
            return entry_file_path;
        }else{
            // 把路径中的所有的\ 替换为/
            return p.replace(/\\/g,'/')
        }
    }
    return entry_file_path
}
