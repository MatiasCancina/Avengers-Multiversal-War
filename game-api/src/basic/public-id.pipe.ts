import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const PUBLIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Injectable()
export class PublicIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || value.length > 64 || !PUBLIC_ID_PATTERN.test(value)) {
      throw new BadRequestException(
        'Identifiers must use lowercase kebab-case and at most 64 characters.',
      );
    }
    return value;
  }
}
