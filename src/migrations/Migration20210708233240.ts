import { Migration } from '@mikro-orm/migrations';

export class Migration20210708233240 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `user` modify `username` json;');
    this.addSql('alter table `user` add unique `user_username_unique`(`username`);');

    this.addSql('alter table `user` add unique `user_username_unique`(`username`);');
  }

}
