import { css } from "lit";

export const COMMON_STYLES = css`
	:host {
		outline-offset: -2px;
		display: flex;
		color: #b3b0aa;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		font-size: 12px;
		user-select: none;
	}
	* {
		box-sizing: border-box;
	}

	.hidden {
		display: none !important;
	}
	h4 {
		box-shadow: inset 0 0 50px #00000022, inset 0 0 8px 1px #00000088;
		text-transform: uppercase;
		font-size: 10px;
		padding: 5px 10px;
		padding-right: 5px;
		font-weight: 600;
		letter-spacing: 2px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	h3 {
		text-transform: uppercase;
		font-size: 12px;
		padding: 5px 10px;
		padding-right: 5px;
		font-weight: 600;
		letter-spacing: 2px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	h1, h2, h3, h4, h5, h6 {
		margin: 0;
	}
	h1, h2, h3, h4, h5, h6, label {
		user-select: none;
		-webkit-user-select: none;
		cursor: default;
	}
	section {
		box-shadow: inset 0 0 20px #00000022, inset 0 0 2px 1px #00000055;
		border-top: 1px solid #333;
		border-bottom: 1px solid #333;
		padding: 6px;
	}

	ui-menu>*:not([slot=trigger]) {
		
		margin: 0;
		overflow-y: auto;
		height: auto;
		max-height: 400px;
		color: #b3b0aa;
		border: 1px solid #555;
		border-radius: 10px;
		box-shadow: 0 0 20px #00000044;
		background-color: #202223;
		
	}
	ui-menu ul {
		gap: 6px;
		display: flex;
		flex-direction: column;
		padding: 4px;
		margin: 0;
		list-style: none;
	}
	ui-menu li {
		border-radius: 3px;
		background-color: #202223;
		padding: 6px 8px;
		cursor: pointer;
		display: flex;
		transition: all 0.2s ease;
		position: relative;
		font-size: 10px;
		align-items: center;
		gap: 12px;
	}
	ui-menu li:not(:last-child)::after {
		content: "";
		inset: 0 5px -3px 5px;
		position: absolute;
		border-bottom: 1px solid #333;
	}
	ui-menu li ui-icon {
		margin-top: -2px;
		margin-bottom: -2px;
	}

	ui-menu li:hover {
		background-color: rgba(226, 180, 97, 0.267);
		outline: 1px solid rgba(226, 180, 97, 0.29);
		outline-offset: -1px;
		color: #fff;
	}
	.ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	select {
		width: fit-content;
		padding: 4px 8px;
		padding-right: 24px;
		border: none;
		border-radius: 4px;
		background-color: #333;
		color: inherit;
		-webkit-appearance: none;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		font-size: 12px;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='18px' viewBox='0 -960 960 960' width='18px' fill='%23ffffff66'%3E%3Cpath d='M480-360 280-560h400L480-360Z'/%3E%3C/svg%3E") !important;
		background-repeat: no-repeat;
		background-position: calc(100% - 2px) center;
		background-size:18px;
		outline: none !important;
	}
	button {
		color: inherit;
		background: #4e4e4e;
		border: none;
		outline: none !important;
		cursor: pointer;
		display: flex;
		gap: 6px;
		align-items: center;
		justify-content: center;
		padding: 6px 12px;
		-webkit-appearance: none;
		text-transform: uppercase;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		font-weight: 600;
		letter-spacing: 1px;
		text-align: center;
		font-size: 12px;
	}
	
`;