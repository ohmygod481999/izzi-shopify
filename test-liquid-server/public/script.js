const inLiquidTextArea = document.getElementById("inLiquid");
const inParamTextArea = document.getElementById("inParam");
const outTextArea = document.getElementById("out");

inLiquidTextArea.focus()

const action = () => {
    const inLiquid = inLiquidTextArea.value;
    let inParam = inParamTextArea.value;
    if (!inParam) {
        inParamTextArea.value = "{}";
        inParam = "{}";
    }

    fetch("/api/render", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            liquid: inLiquid,
            param: JSON.parse(inParam),
        }),
    })
        .then((res) => res.json())
        .then((res) => {
            const { renderLiquid } = res;
            outTextArea.value = renderLiquid;
        });
};

inLiquidTextArea.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.keyCode === 13) {
        action();
    }
});

document.getElementById("submit-btn").addEventListener("click", () => {
    action();
});
