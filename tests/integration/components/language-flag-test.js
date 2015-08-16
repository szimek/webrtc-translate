import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('language-flag', 'Integration | Component | language flag', {
  integration: true
});

test('it renders', function (assert) {
  assert.expect(1);

  this.set('language', 'en-GB');
  this.render(hbs`{{language-flag language=language}}`);

  assert.ok(this.$('div').hasClass('GB'));
});
