import React from 'react'
import { mount } from 'enzyme'
import DataGrid, {ColumnHeader, EditableColumnName} from './DataGrid'

describe('DataGrid tests,', () => {
  var testData = {
    totalRows: 2,
    columns: ['aaa', 'bbbb', 'ccccc', 'rn_'],
    'column_types': [
      'number',
      'text',
      'text',
      'text'
    ],
    rows: [
      {
        'aaa': 9,
        'bbbb': 'foo',
        'ccccc': '9', // use digits that will not appear in our row numbers, so we can test
        'rn_': 'someval' // deliberately conflict with DataGrid's default row number column key
      },
      {
        'aaa': 9,
        'bbbb': '',
        'ccccc': 'baz',
        'rn_': 'someotherval'
      }
    ]
  }

  var setDropdownAction = jest.fn()
  var onRenameColumn = jest.fn()

  function getRow (i) {
    return testData.rows[i]
  }

  it('Renders the grid', () => {
    var editCellMock = jest.fn()
    var sortMock = jest.fn()

    const tree = mount(
      <DataGrid
        wfModuleId={100}
        lastRelevantDeltaId={999}
        totalRows={testData.totalRows}
        columns={testData.columns}
        columnTypes={testData.column_types}
        getRow={getRow}
        onEditCell={editCellMock}
        onGridSort={sortMock} // I tried but could not get this to work, similar to onEditCell
        isReadOnly={false}
        setDropdownAction={setDropdownAction}
        onReorderColumns={jest.fn()}
        onRenameColumn={onRenameColumn}
      />
    )

    // Check that we ended up with five columns (first is row number), with the right names
    // If rows values are not present, ensure intial DataGrid state.gridHeight > 0
    expect(tree.find('HeaderCell')).toHaveLength(5)

    // We now test the headers separately
    expect(tree.find('EditableColumnName')).toHaveLength(4)
    expect(tree.find('EditableColumnName').get(0).props.columnKey).toBe('aaa')
    expect(tree.find('EditableColumnName').get(1).props.columnKey).toBe('bbbb')
    expect(tree.find('EditableColumnName').get(2).props.columnKey).toBe('ccccc')
    expect(tree.find('EditableColumnName').get(3).props.columnKey).toBe('rn_')

    let text = tree.text()

    expect(text).toContain('foo') // some cell values
    expect(text).toContain('someval')

    expect(text).toContain('1') // row numbers
    expect(text).toContain('2')

    // row number column should not have the same name as any of our cols
    expect(testData.columns.includes(tree.find('DataGrid').instance().rowNumKey)).toBeFalsy()

    expect(tree).toMatchSnapshot()

    tree.unmount()

    // Double click on a cell, enter text, enter, and ensure onCellEdit is called
    // Sadly, can't get this to work
    // var cell = tree.find('Cell').first();
    // expect(cell).toHaveLength(1)
    // cell.simulate('doubleclick');
    // cell.simulate('keydown', { which: 'X' });
    // cell.simulate('keydown', { which: '\n' });
    // expect(editCellMock.mock.calls).toHaveLength(1);
  })

  it('matches snapshot without data', () => {
    const tree = mount(
      <DataGrid
        wfModuleId={100}
        lastRelevantDeltaId={999}
        totalRows={0}
        columns={[]}
        columnTypes={[]}
        getRow={() => {}}
        isReadOnly={false}
        setDropdownAction={setDropdownAction}
        onReorderColumns={jest.fn()}
        onRenameColumn={onRenameColumn}
      />
    )
    expect(tree.find('HeaderCell')).toHaveLength(0)

    expect(tree).toMatchSnapshot()

    tree.unmount()
  })

  it('Shows/hides letters in the header according to props', () => {
    const treeWithLetter = mount(
      <DataGrid
        wfModuleId={100}
        lastRelevantDeltaId={999}
        totalRows={testData.totalRows}
        columns={testData.columns}
        columnTypes={testData.column_types}
        getRow={getRow}
        showLetter
        isReadOnly={false}
        setDropdownAction={setDropdownAction}
        onReorderColumns={jest.fn()}
        onRenameColumn={onRenameColumn}
      />
    )
    expect(treeWithLetter.find('.column-letter')).toHaveLength(4)
    expect(treeWithLetter.find('.column-letter').at(0).text()).toEqual('A')
    expect(treeWithLetter.find('.column-letter').at(1).text()).toEqual('B')
    expect(treeWithLetter.find('.column-letter').at(2).text()).toEqual('C')
    expect(treeWithLetter.find('.column-letter').at(3).text()).toEqual('D')

    treeWithLetter.unmount()

    const treeWithoutLetter = mount(
      <DataGrid
        wfModuleId={100}
        lastRelevantDeltaId={999}
        totalRows={testData.totalRows}
        columns={testData.columns}
        columnTypes={testData.column_types}
        getRow={getRow}
        showLetter={false}
        isReadOnly={false}
        setDropdownAction={setDropdownAction}
        onReorderColumns={jest.fn()}
        onRenameColumn={onRenameColumn}
      />)
    expect(treeWithoutLetter.find('.column-letter')).toHaveLength(0)

    treeWithoutLetter.unmount()
  })

  it('Calls column rename upon editing a column header', (done) => {
    var tree = mount(
      <DataGrid
        wfModuleId={100}
        lastRelevantDeltaId={999}
        totalRows={testData.totalRows}
        columns={testData.columns}
        columnTypes={testData.column_types}
        getRow={getRow}
        onReorderColumns={jest.fn()}
        onRenameColumn={onRenameColumn}
        isReadOnly={false}
        setDropdownAction={setDropdownAction}
      />
    )

    expect(tree.find('EditableColumnName')).toHaveLength(4)
    // Tests rename on aaaColumn
    let aaaColumn = tree.find('EditableColumnName').first()
    aaaColumn.simulate('click')
    setImmediate(() => {
      // tree.update();
      let newAaaColumn = tree.find('EditableColumnName').first()
      expect(newAaaColumn.find('input[value="aaa"]')).toHaveLength(1)
      let aaaInput = newAaaColumn.find('input[value="aaa"]')
      aaaInput.simulate('change', {target: {value: 'aaaa'}})
      aaaInput.simulate('blur')
      setImmediate(() => {
        expect(onRenameColumn.mock.calls).toHaveLength(1)
        // First argument should be wfModuleId (100)
        expect(onRenameColumn.mock.calls[0][0]).toBe(100)
        // Second argument should be the new entry, {prevName: 'aaa', newName: 'aaaa'}
        expect(onRenameColumn.mock.calls[0][3].prevName).toBe('aaa')
        expect(onRenameColumn.mock.calls[0][3].newName).toBe('aaaa')
        tree.unmount()
        done()
      })
    })
  })

  it('Respects isReadOnly setting for rename columns', (done) => {
    var tree = mount(
      <DataGrid
        wfModuleId={100}
        lastRelevantDeltaId={999}
        totalRows={testData.totalRows}
        columns={testData.columns}
        columnTypes={testData.column_types}
        getRow={getRow}
        isReadOnly
        setDropdownAction={setDropdownAction}
        onReorderColumns={jest.fn()}
        onRenameColumn={onRenameColumn}
      />
    )

    expect(tree.find('EditableColumnName')).toHaveLength(4)
    // Tests rename on aaa column
    let aaaColumn = tree.find('EditableColumnName').first()
    aaaColumn.simulate('click')
    setImmediate(() => {
      // In the read-only case, the header should not turn into an input box
      let newAaaColumn = tree.find('EditableColumnName').first()
      expect(newAaaColumn.find('input.column-key-input')).toHaveLength(0)
      done()
    })
  })

  it('Should set className to include type', (done) => {
    var tree = mount(
      <DataGrid
        wfModuleId={100}
        lastRelevantDeltaId={999}
        totalRows={testData.totalRows}
        columns={testData.columns}
        columnTypes={testData.column_types}
        getRow={getRow}
        isReadOnly
        setDropdownAction={setDropdownAction}
        onReorderColumns={jest.fn()}
        onRenameColumn={onRenameColumn}
      />
    )

    setImmediate(() => {
      expect(tree.find('.cell-text').first()).toHaveLength(1)
      expect(tree.find('.cell-number').first()).toHaveLength(1)
      tree.unmount()
      done()
    })
  })

  it('Should display "null" for none types', (done) => {
    var tree = mount(
      <DataGrid
        wfModuleId={100}
        lastRelevantDeltaId={999}
        totalRows={testData.totalRows}
        columns={testData.columns}
        columnTypes={testData.column_types}
        getRow={(i) => ({ aaa: null, bbbb: null, ccccc: null, rn_: 'rn'})}
        isReadOnly
        setDropdownAction={setDropdownAction}
        onReorderColumns={jest.fn()}
        onRenameColumn={onRenameColumn}
      />
    )

    setImmediate(() => {
      expect(tree.find('.cell-null').first().text()).toBe('null')
      tree.unmount()
      done()
    })
  })

})
