export const getWrongTimeFormatMessage = (command: string): string => {
  return `Horário no formato inválido, utilize 10, 10h, 10:15, 10h15.\nEx: ${command} 10h Largo do Bicão`
}

export const getHelpMessage = (): string => {
  return (
    'Olá! Sou o Carona Bot v2.0!\n\n' +
    '/lista - Lista as caronas registradas.\n' +
    '/ida <b>[horário] [descrição]</b> - Adiciona sua ida para o horário especificado. Se você já possuir uma ida, ela será atualizada.\n<b>Ex: /ida 7:30 Vila da Penha</b>\n' +
    '/volta <b>[horário] [descrição]</b> - Adiciona sua volta para o horário especificado. Se você já possuir uma volta, ela será atualizada.\n<b>Ex: /volta 17 Largo do Bicão</b>\n' +
    '/remover <b>ida</b>/<b>volta</b> - Remove sua ida ou volta, dependendo da opção escolhida. <b>Ex: /remover ida</b>\n' +
    '/lotou <b>ida</b>/<b>volta</b> - Marca a sua carona de ida ou volta como lotada, dependendo da opção escolhida. <b>Ex: /lotou volta</b>\n' +
    '/vagou <b>ida</b>/<b>volta</b> - Marca a sua carona de ida ou volta como disponível, dependendo da opção escolhida. <b>Ex: /vagou ida</b>\n' +
    '/help ou /ajuda - Exibe essa mensagem.\n\n' +
    `Criado por ${getUserLink(173433762, 'Fabiana', 'Ferreira')} e ${getUserLink(
      146544127,
      'Lucas',
      'Cerqueira'
    )}.`
  )
}

export const createFullRideMessage = (
  wasSuccessful: boolean,
  params: { direction: string; userFirstName?: string }
) => {
  return wasSuccessful
    ? `Estado da sua carona de ${params.direction} alterado.`
    : `${params.userFirstName}, ou você não possui uma carona cadastrada, ou já passou do horário.`
}

export const getUserLink = (id: number, name: string, lastName: string): string =>
  `<a href="tg://user?id=${id}">${name} ${lastName || ''}</a>`
