import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'PrismaService',
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: 'JwtService',
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    })
      .useMocker((token) => {
        return {};
      })
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
