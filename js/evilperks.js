function getEvilPerksGeneration()
{
	if (gameData.evil == 0) return 0
	let essence_perk_buff_mult = 1e9
	if (gameData.essence == 0)
		essence_perk_buff_mult = 10
	else if (gameData.essence<1e308/essence_perk_buff_mult)
		essence_perk_buff_mult *= gameData.essence
	else
		essence_perk_buff_mult = 1e308
	return math.log10(gameData.evil + 1) * math.log10(essence_perk_buff_mult) / 365	
}

function getEyeRequirement(){
	let newreq = 65 - gameData.evil_perks.reduce_eye_requirement * 5
	return newreq < 15 ? 15 : newreq
}

function getEvilRequirement(){
	let newreq = 200 - gameData.evil_perks.reduce_evil_requirement * 12.5
	newreq = newreq < 25 ? 25 : newreq
	newreq = getEyeRequirement() > newreq ? getEyeRequirement() : newreq
	return newreq
}

function getVoidRequirement(){
	let newreq = 1000 - gameData.evil_perks.reduce_the_void_requirement * 100
	newreq = getEvilRequirement() > newreq ? getEvilRequirement() : newreq
	return newreq < 100 ? 100 : newreq
}

function getCelestialRequirement(){
	let newreq = 10000 - gameData.evil_perks.reduce_celestial_requirement * 1000
	return newreq < 1000 ? 1000 : newreq
}

function getEssenceReward(){	
	return getEssenceRewardPercent() / 100.0 * gameData.essence
}

function getEssenceRewardPercent(){	
	return (gameData.evil_perks.receive_essence + 1) * 10
}

function getEvilPerkCost(evilperknum){
	switch (evilperknum){
	case 1:
		if (gameData.evil_perks.reduce_eye_requirement == 10)
			return Infinity
		return math.pow(2, gameData.evil_perks.reduce_eye_requirement + 1) + 4.6
	case 2:
		if (gameData.evil_perks.reduce_evil_requirement == 14)
			return Infinity
		return math.pow(3, gameData.evil_perks.reduce_evil_requirement + 1) + 66.6-3
	case 3: 
		if (gameData.evil_perks.reduce_the_void_requirement == 9)
			return Infinity
		return math.pow(5, gameData.evil_perks.reduce_the_void_requirement + 1) + 666.6-5
	case 4:
		if (gameData.evil_perks.reduce_celestial_requirement == 9)
			return Infinity
		return math.pow(5, gameData.evil_perks.reduce_celestial_requirement + 1) + 6666-5
	case 5:
		if (gameData.essence >= 1e308)
			return Infinity
		return math.pow(10, gameData.evil_perks.receive_essence) * 6.66e9
	}	
}

function buyEvilPerk(evilperknum){
	switch (evilperknum){
		case 1:
			if (gameData.evil_perks_points >= getEvilPerkCost(1))
			{
				gameData.evil_perks_points -= getEvilPerkCost(1)
				gameData.evil_perks.reduce_eye_requirement += 1
			}
			break;
		case 2:
			if (gameData.evil_perks_points >= getEvilPerkCost(2))
			{
				gameData.evil_perks_points -= getEvilPerkCost(2)
				gameData.evil_perks.reduce_evil_requirement += 1
			}
			break;
		case 3:
			if (gameData.evil_perks_points >= getEvilPerkCost(3))
			{
				gameData.evil_perks_points -= getEvilPerkCost(3)
				gameData.evil_perks.reduce_the_void_requirement += 1
			}
			break;
		case 4:
			if (gameData.evil_perks_points >= getEvilPerkCost(4))
			{
				gameData.evil_perks_points -= getEvilPerkCost(4)
				gameData.evil_perks.reduce_celestial_requirement += 1
			}
			break;
		case 5:
			if (gameData.evil_perks_points >= getEvilPerkCost(5))
			{
				gameData.evil_perks_points -= getEvilPerkCost(5)
				gameData.evil_perks.receive_essence += 1
				gameData.essence += getEssenceReward()
			}
			break;
	}
}

function hasEvilPerk(i)
{
	switch(i){
		case 1: return gameData.evil_perks.reduce_eye_requirement > 0
		case 2: return gameData.evil_perks.reduce_evil_requirement > 0
		case 3: return gameData.evil_perks.reduce_the_void_requirement > 0
		case 4: return gameData.evil_perks.reduce_celestial_requirement > 0
		case 5: return gameData.evil_perks.receive_essence > 0
	}
}

function getAge0Requirement(){
	const eyeReq = getEyeRequirement()
	switch	(eyeReq){
	case 65:
		return 25
	case 60:
		return 25
	case 55:
		return 25
	case 50:
		return 25
	case 45:
		return 25
	case 40:
		return 25
	case 35:
		return 20
	case 30:
		return 20
	case 25:
		return 18
	case 20:
		return 16
	case 15:
		return 13
	}
}

function getAge1Requirement(){
	const eyeReq = getEyeRequirement()
	switch	(eyeReq){
	case 65:
		return 45
	case 60:
		return 45
	case 55:
		return 45
	case 50:
		return 45
	case 45:
		return 40
	case 40:
		return 35
	case 35:
		return 30
	case 30:
		return 25
	case 25:
		return 20
	case 20:
		return 18
	case 15:
		return 14
	}
}