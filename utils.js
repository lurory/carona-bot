function strikeThrough (text) {
    return text.split('').map(char => char + '\u0336').join('')
}

function addZeroPadding (time) {
    if (time < 10)
        return "0" + time
    return time
}

function getUserEmoji (user) {
    if (user.username === "Mateus_Street")
        return "\u{1F697}"
    if (user.username === "Fabits")
        return "\u{1F33B}"
    if (user.username === "LucasCerqueira")
        return "\u{2618}"
    return ""
}

function getSpecialDayEmoji (day, month) {
    //Christmas
    if (month == 12)
    {
        //New year
        if (day == 31)    
            return "\u{1F386} "
        return "\u{1F385} \u{1F384} "
    }
    //Vacation
    if (month == 1)
        return "\u{1F3D6} "
    //Halloween
    if (day == 31 && month == 10)
        return "\u{1F383} "

    return ""
}

module.exports = {
    strikeThrough,
    addZeroPadding,
    getUserEmoji,
    getSpecialDayEmoji
}