jest.mock('../assets/images/deleted-user.png', () => 'deleted-user.png');

// The models read a few browser globals when loaded; the test runs in plain Node.
global.window = global.window || { matchMedia: () => ({ matches: false }) };

const { default: orm } = require('../orm');
const { selectCardPositionForClosedState } = require('./positioning');

const GAP = 65536;

const buildState = (cards) => {
  const session = orm.session(orm.getEmptyState());

  session.List.create({ id: 'l1', boardId: 'b1', type: 'active', position: GAP, name: 'List' });

  cards.forEach(([id, position, isClosed]) => {
    session.Card.create({ id, listId: 'l1', boardId: 'b1', position, name: id, isClosed });
  });

  return { orm: session.state };
};

const select = (state, cardId, isClosed) =>
  selectCardPositionForClosedState(state, cardId, isClosed);

describe('selectCardPositionForClosedState', () => {
  test('checked card goes below every other card, including already checked ones', () => {
    const state = buildState([
      ['a', GAP, false],
      ['b', GAP * 2, false],
      ['c', GAP * 3, true],
    ]);

    expect(select(state, 'a', true)).toBe(GAP * 4);
  });

  test('checking the last card keeps it at the bottom', () => {
    const state = buildState([
      ['a', GAP, false],
      ['b', GAP * 2, false],
    ]);

    expect(select(state, 'b', true)).toBe(GAP * 2);
  });

  test('unchecked card returns just above the first checked card', () => {
    const state = buildState([
      ['a', GAP, false],
      ['b', GAP * 2, false],
      ['c', GAP * 3, true],
      ['d', GAP * 4, true],
    ]);

    const position = select(state, 'd', false);

    expect(position).toBeGreaterThan(GAP * 2);
    expect(position).toBeLessThan(GAP * 3);
  });

  test('unchecked card with no other checked cards keeps its position', () => {
    const state = buildState([
      ['a', GAP, false],
      ['b', GAP * 2, true],
    ]);

    expect(select(state, 'b', false)).toBeUndefined();
  });

  test('unchecking when all cards are checked puts it on top', () => {
    const state = buildState([
      ['a', GAP, true],
      ['b', GAP * 2, true],
    ]);

    expect(select(state, 'b', false)).toBe(GAP / 2);
  });
});
