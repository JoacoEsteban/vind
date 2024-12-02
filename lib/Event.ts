export class Success {
  constructor(
    public message: string,
    public code: string,
  ) {}
}

export class RegistrationSuccess extends Success {
  constructor() {
    super('Registration successful', 'REGISTRATION_SUCCESS')
  }
}
