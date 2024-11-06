export function extractStrings(from: any, ret?: string[]) {
	ret ??= [];
	if (typeof from == 'string') {
		ret.push(from);
		return ret;
	}
	if (Array.isArray(from)) {
		from.forEach(item => extractStrings(item, ret));
		return ret;
	}
	if (typeof from == 'object') {
		for (let key in from) extractStrings(from[key], ret);
		return ret;
	}
	return ret;
}
