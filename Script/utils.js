// script/utils.js

/**
 * 根据屏幕中心坐标生成面部显示位置。
 * 模拟 MATLAB 的 generate_places 函数。
 * @param {number} x - 屏幕中心的X坐标。
 * @param {number} y - 屏幕中心的Y坐标。
 * @returns {number[][]} 包含28个面部矩形位置的数组，每个位置是 [x1, y1, x2, y2]。
 */
export function generatePlaces(x, y) {
    const places = [];

    // 这里的坐标是相对于屏幕中心 (x, y) 的偏移量
    // 每个 place 是一个 [left, top, right, bottom] 数组
    // 假设面部刺激的尺寸大约是 80x100 像素 (宽度 x 高度)

    // 示例：将 MATLAB 中的坐标直接翻译过来
    places.push([x - 40, y + 25, x + 40, y + 125]);   // place1
    places.push([x - 40, y - 125, x + 40, y - 25]);   // place2
    places.push([x - 125, y - 50, x - 45, y + 50]);   // place3
    places.push([x + 45, y - 50, x + 125, y + 50]);   // place4
    places.push([x - 155, y + 65, x - 75, y + 165]);  // place5
    places.push([x - 155, y - 165, x - 75, y - 65]);  // place6
    places.push([x + 75, y + 65, x + 155, y + 165]);  // place7
    places.push([x + 75, y - 165, x + 155, y - 65]);  // place8
    places.push([x - 40, y + 135, x + 40, y + 235]);  // place9
    places.push([x - 40, y - 235, x + 40, y - 135]);  // place10
    places.push([x - 40, y + 245, x + 40, y + 345]);  // place11
    places.push([x - 40, y - 345, x + 40, y - 245]);  // place12
    places.push([x - 225, y - 50, x - 145, y + 50]);  // place13
    places.push([x + 145, y - 50, x + 225, y + 50]);  // place14
    places.push([x - 325, y - 50, x - 245, y + 50]);  // place15
    places.push([x + 245, y - 50, x + 325, y + 50]);  // place16
    places.push([x - 240, y + 165, x - 160, y + 265]);// place17
    places.push([x - 240, y - 265, x - 160, y - 165]);// place18
    places.push([x + 160, y + 165, x + 240, y + 265]);// place19
    places.push([x + 160, y - 265, x + 240, y - 165]);// place20
    places.push([x - 280, y + 55, x - 200, y + 155]); // place21
    places.push([x - 280, y - 155, x - 200, y - 55]); // place22
    places.push([x + 200, y + 55, x + 280, y + 155]); // place23
    places.push([x + 200, y - 155, x + 280, y - 55]); // place24
    places.push([x - 145, y + 205, x - 65, y + 305]); // place25
    places.push([x - 145, y - 305, x - 65, y - 205]); // place26
    places.push([x + 65, y + 205, x + 145, y + 305]); // place27
    places.push([x + 65, y - 305, x + 145, y - 205]); // place28

    return places;
}

/**
 * 随机打乱数组的顺序（Fisher-Yates 洗牌算法）。
 * @param {Array} array - 要打乱的数组。
 * @returns {Array} 打乱后的新数组。
 */
export function shuffleArray(array) {
    const newArray = [...array]; // 创建一个副本，避免修改原数组
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}