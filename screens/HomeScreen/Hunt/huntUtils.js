// hooks/useHuntSteps.js  (add at top, above the hook)

export function withStats(mon) {
	return {
		...mon,
		hp: mon.level * 50,
		attack: mon.level * 10,
	};
}

export function simulateWinChance(playerHP, playerAtk, armorMit, monster, sims = 100) {
	const stats = withStats(monster);
	let wins = 0;
	for (let i = 0; i < sims; i++) {
		let hp = playerHP;
		let mHP = stats.hp;
		while (hp > 0 && mHP > 0) {
			mHP -= playerAtk;
			if (mHP <= 0) {
				wins++;
				break;
			}
			const rawDmg = 1 + Math.floor(Math.random() * stats.attack);
			const netDmg = Math.max(1, rawDmg - armorMit);
			hp -= netDmg;
		}
	}
	return Math.round((wins / sims) * 100);
}
