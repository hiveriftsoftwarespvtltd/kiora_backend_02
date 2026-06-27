import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ContactModule } from './modules/contact/contact.module';
import { UploadModule } from './modules/upload/upload.module';
import { DecorModule } from './modules/decor/decor.module';
import { CouponsModule } from './modules/coupons/coupons.module';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // MongoDB Mongoose Connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    // NodeMailer SMTP Mailer
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com',
          port: parseInt(configService.get<string>('EMAIL_PORT') || '587'),
          secure: configService.get<string>('EMAIL_SECURE') === 'true',
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM') || '"KIORA LIFE Style" <noreply@kioralifestyle.com>',
        },
      }),
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    CustomersModule,
    OrdersModule,
    ContactModule,
    UploadModule,
    DecorModule,
    CouponsModule,
  ],
})
export class AppModule {}
