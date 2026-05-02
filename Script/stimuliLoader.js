// script/stimuliLoader.js
/**
 * 预加载图片刺激。
 * @param {string[]} paths - 图片文件的URL路径数组。
 * @returns {Promise<Map<string, HTMLImageElement>>} 一个Promise，解析为图片路径到HTMLImageElement对象的Map。
 */
export function preloadStimuli(paths) {
    console.log('开始预加载刺激...');
    const imagePromises = paths.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                console.log(`加载完成: ${path}`);
                resolve([path, img]); // 返回路径和图片对象
            };
            img.onerror = () => {
                console.error(`加载失败: ${path}`);
                reject(new Error(`无法加载图片: ${path}`));
            };
        });
    });

    return Promise.all(imagePromises).then(results => {
        // 将结果转换为 Map，方便通过路径查找图片
        const loadedStimuliMap = new Map();
        results.forEach(([path, img]) => {
            loadedStimuliMap.set(path, img);
        });
        return loadedStimuliMap;
    });
}