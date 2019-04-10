// Function to return the strikethrough version
// of a giver string.
function strikeThrough(text) {
    return text.split('').map(char => char + '\u0336').join('')
}

// Function to zero pad hour or minute strings
function addZeroPadding(time) {
    if (time < 10)
        return "0" + time
    return time
}

// Easter-egg function to return special emojis for some users
function getUserEmoji(user) {
    if (user.username === "Mateus_Street")
        return "\u{1F697}"
    if (user.username === "Fabits")
        return "\u{1F994}"
    if (user.username === "LucasCerqueira")
        return "\u{2618}"
    if (user.username === "naruzete")
        return "\u{1F419}"
    return ""
}

// Easter-egg function to return emojis for special dates
function getSpecialDayEmoji(day, month) {
    //Easter
    if (month === 4 && (day === 17 || day === 18 || day == 19 || day == 20 || day == 21))
        return "\u{1F430}"
    //Christmas
    if (month === 12) {
        //New year
        if (day === 31)
            return "\u{1F386} "
        return "\u{1F385} \u{1F384} "
    }
    //Vacation
    if (month === 1)
        return "\u{1F3D6} "
    //Halloween
    if (day === 31 && month === 10)
        return "\u{1F383} "

    return ""
}

function getHelpMessage() {
    return "Olá! Sou o Carona Bot v2.0!\n\n" +
        "/lista - Lista as caronas registradas.\n" +
        "/ida *[horário] [descrição]* - Adiciona sua ida para o horário especificado. *Ex: /ida 7:30 Vila da Penha*\n" +
        "/volta *[horário] [descrição]* - Adiciona sua volta para o horário especificado. *Ex: /ida 17 Largo do Bicão*\n" +
        "/remover *ida*/*volta* - Remove sua ida ou volta, dependendo da opção escolhida. *Ex: /remover ida*\n" +
        "/lotou *ida*/*volta* - Marca a sua carona de ida ou volta como lotada, dependendo da opção escolhida. *Ex: /lotou volta*\n" +
        "/vagou *ida*/*volta* - Marca a sua carona de ida ou volta como disponível, dependendo da opção escolhida. *Ex: /vagou ida*\n" +
        "/help ou /ajuda - Exibe essa mensagem.\n\n" +
        "Criado por [Fabiana Ferreira](tg://user?id=173433762) e [Lucas Cerqueira](tg://user?id=146544127)."
}

module.exports = {
    strikeThrough,
    addZeroPadding,
    getUserEmoji,
    getSpecialDayEmoji,
    getHelpMessage
}