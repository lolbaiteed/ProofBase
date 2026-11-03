import { Migration } from '@mikro-orm/migrations';

export class Migration20261103105732 extends Migration {

  override name = 'Migration20261103105732';

  override up(): void | Promise<void> {
    this.addSql(`alter table "app_user" add "next_key_refresh_at" date null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "app_user" drop column "next_key_refresh_at";`);
  }

}
