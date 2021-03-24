'use strict';


//因为[]也是object 所以要用Object.prototype.toString.call() 方法来判断
function isObject(obj) {
    return Object.prototype.toString.call(obj)==="[object Object]"
}


module.exports = {
    isObject,
};