import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
  });

  await knex.schema.createTable('sessions', (table) => {
    table.string('id').primary();
    table.string('user_id').references('id').inTable('users');
    table.datetime('expires_at').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('sessions');
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email');
    table.dropColumn('password_hash');
  });
}