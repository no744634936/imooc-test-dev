'use strict';


//因为[]也是object 所以要用Object.prototype.toString.call() 方法来判断
function isObject(obj) {
    return Object.prototype.toString.call(obj)==="[object Object]"
}


// 下载package的时候显示转动的转动图标
function spinner_start(message){
    let Spinner = require('cli-spinner').Spinner;
    let spinner = new Spinner(message+'%s');
    spinner.setSpinnerString('|/-\\');
    spinner.start();
    return spinner
}

//JavaScript里有setTimeout()方法来实现设定一段时间后执行某个任务，但写法很丑陋，需要提供回调函数：
//这种写法很优雅，很像其它编程语言里的延迟、等待函数。Promise API使我们避免传入回调函数
function sleep(time){
    return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = {
    isObject,
    spinner_start,
    sleep
};