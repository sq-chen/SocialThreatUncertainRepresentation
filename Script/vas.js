// script/vas.js

/**
 * 在 Canvas 上设置并绘制 VAS 评分条。
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D 渲染上下文。
 * @param {object} vasConfig - VAS 配置对象，包含 hl, cposmaxl, cposmaxr 等。
 * @param {number} initialValue - 初始光标位置 (0-100)。
 * @param {number} maxDuration - 最大持续时间（毫秒），可选。
 * @returns {Promise<object>} 解析为包含 rating 和 reactionTime 的对象。
 */
export function getVASRating(ctx, vasConfig, initialValue = 50, maxDuration = null) {
    console.log('getVASRating called with:', { ctx, vasConfig, initialValue, maxDuration }); // 调试信息
    return new Promise(resolve => {
        const canvas = ctx.canvas;
        const hl = vasConfig.hl;
        console.log('vasConfig.hl:', hl); // 调试信息
        const midX = canvas.width / 2;
        const midY = canvas.height / 2;

        const xl = midX - hl / 2;
        const xr = midX + hl / 2;
        const y = midY; // 评分条在屏幕正中

        const yb = y - 15; // 评分条的顶部Y坐标
        const yt = y + 15; // 评分条的底部Y坐标
        const pw = 2; // 线宽

        let cursorX = xl + (initialValue / 100) * hl; // 初始光标位置
        let isDragging = false; // 添加一个标志来跟踪拖动状态
        
        // 记录VAS评分开始时间
        const startTime = performance.now();

        // 清理函数，用于移除所有事件监听器
        const cleanup = () => {
            canvas.removeEventListener('mousemove', onVASMouseMove);
            canvas.removeEventListener('mousedown', onVASMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };

        // 解析函数，用于统一处理结果
        const resolveWithResult = () => {
            cleanup();
            const endTime = performance.now();
            const reactionTime = endTime - startTime;
            const finalRating = Math.round(((cursorX - xl) / hl) * 100);
            console.log('VAS resolve with:', { rating: finalRating, reactionTime: reactionTime }); // 调试信息
            resolve({
                rating: finalRating,
                reactionTime: reactionTime
            });
        };

        const drawVAS = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
            ctx.fillStyle = 'rgb(122, 122, 122)'; // 填充灰色背景
            ctx.fillRect(0, 0, canvas.width, canvas.height); // 填充整个画布

            ctx.fillStyle = 'black'; // 文本颜色
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle'; // 垂直居中文本

            // 绘制评分条主线
            ctx.strokeStyle = 'black';
            ctx.lineWidth = pw;
            ctx.beginPath();
            ctx.moveTo(xl, y);
            ctx.lineTo(xr, y);
            ctx.stroke();

            // 绘制刻度线
            ctx.beginPath();
            ctx.moveTo(xl, yb + 5); ctx.lineTo(xl, yt - 5); // 0% 刻度
            ctx.moveTo(midX, yb + 5); ctx.lineTo(midX, yt - 5); // 50% 刻度
            ctx.moveTo(xr, yb + 5); ctx.lineTo(xr, yt - 5); // 100% 刻度
            // 绘制小刻度
            const step = hl / 10;
            for (let i = 1; i < 10; i++) {
                const xPos = xl + i * step;
                ctx.moveTo(xPos, yb + 7); ctx.lineTo(xPos, yt - 7);
            }
            ctx.stroke();

            // 绘制文本标签
            ctx.fillText('0%', xl - 20, y + 50);
            ctx.fillText('50%', midX, y + 50);
            ctx.fillText('100%', xr + 20, y + 50);

            // 绘制光标
            ctx.fillStyle = 'red';
            ctx.fillRect(cursorX - 3, yb, 6, yt - yb); // 光标宽度 6px
        };

        // 新的鼠标移动处理函数，鼠标悬浮即动
        const onVASMouseMove = (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            // 调试输出，必须放在变量定义后
            console.log('mouseX:', mouseX, 'mouseY:', mouseY, 'xl:', xl, 'xr:', xr, 'y:', y);

            // 只要在canvas内就移动浮标
            cursorX = Math.max(xl, Math.min(xr, mouseX));
            drawVAS();
            canvas.style.cursor = 'pointer';
        };

        // 鼠标点击提交评分
        const onVASMouseDown = (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            if (mouseX >= xl && mouseX <= xr && mouseY >= (y - 30) && mouseY <= (y + 30)) {
                // 只在VAS条区域内允许提交
                resolveWithResult();
            }
        };

        // 键盘提交评分
        const onKeyDown = (event) => {
            if (event.code === 'Enter' || event.code === 'Space') {
                resolveWithResult();
            }
        };

        // 初始绘制 VAS
        drawVAS();

        // 添加事件监听器
        canvas.addEventListener('mousemove', onVASMouseMove);
        canvas.addEventListener('mousedown', onVASMouseDown);
        document.addEventListener('keydown', onKeyDown);

        // 如果设置了最大持续时间，添加超时处理
        if (maxDuration && maxDuration > 0) {
            setTimeout(() => {
                console.log('VAS timeout reached, auto-submitting'); // 调试信息
                resolveWithResult();
            }, maxDuration);
        }
    });
}
