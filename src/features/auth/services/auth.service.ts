import { ApiResponse } from '../../shared/types';
import { LoginCredentials, RegisterData, User } from '../types';

// Servicio de autenticación
export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Iniciar sesión
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      // Aquí se implementaría la llamada a la API
      // Por ahora simulamos la respuesta
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        firstName: 'Usuario',
        lastName: 'Demo',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'mock-jwt-token';

      this.currentUser = mockUser;
      this.token = mockToken;

      return {
        data: { user: mockUser, token: mockToken },
        message: 'Login exitoso',
        success: true,
        statusCode: 200,
      };
    } catch (error) {
      throw new Error('Error al iniciar sesión');
    }
  }

  // Registrarse
  async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      // Aquí se implementaría la llamada a la API
      const mockUser: User = {
        id: '1',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'mock-jwt-token';

      this.currentUser = mockUser;
      this.token = mockToken;

      return {
        data: { user: mockUser, token: mockToken },
        message: 'Registro exitoso',
        success: true,
        statusCode: 201,
      };
    } catch (error) {
      throw new Error('Error al registrarse');
    }
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    this.currentUser = null;
    this.token = null;
    // Aquí se podría implementar la invalidación del token en el servidor
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.token !== null;
  }

  // Obtener token
  getToken(): string | null {
    return this.token;
  }

  // Restablecer contraseña
  async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      // Aquí se implementaría la llamada a la API
      return {
        data: undefined,
        message: 'Email de restablecimiento enviado',
        success: true,
        statusCode: 200,
      };
    } catch (error) {
      throw new Error('Error al restablecer contraseña');
    }
  }

  // Actualizar perfil
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    try {
      if (!this.currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const updatedUser = { ...this.currentUser, ...data, updatedAt: new Date() };
      this.currentUser = updatedUser;

      return {
        data: updatedUser,
        message: 'Perfil actualizado',
        success: true,
        statusCode: 200,
      };
    } catch (error) {
      throw new Error('Error al actualizar perfil');
    }
  }
}
