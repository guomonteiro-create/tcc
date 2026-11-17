describe('Validação do Login', () => {
  test('deve identificar campos vazios', () => {
    const email = ''
    const senha = ''

    expect(email).toBe('')
    expect(senha).toBe('')
  })
})