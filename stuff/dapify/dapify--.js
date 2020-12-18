
import("/stuff/dapify.dap.js").then(dapify=>dapify&&
	[...document.getElementsByClassName("dap")].forEach(
		pre=>dapify.RENDER({
			code:pre.textContent,
			style:pre.getAttribute("data-style")
		},
		null,
		pre
		)
	)
)