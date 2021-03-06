/* global describe, it, expect, jest */
import React from 'react'
import ChartSeriesMultiSelect from './ChartSeriesMultiSelect'
import { mount } from 'enzyme'

describe('ChartSeriesMultiSelect', () => {
  function wrapper (props = {}) {
    return mount(
      <ChartSeriesMultiSelect
        series={[
          { column: 'A', color: '#aaaaaa' },
          { column: 'B', color: '#bbbbbb' }
        ]}
        isReadOnly={false}
        prompt={'prompt'}
        allColumns={[ { name: 'A' }, { name: 'B' }, { name: 'C' } ]}
        onChange={jest.fn()}
        {...props}
      />
    )
  }

  it('should match snapshot', () => {
    const w = wrapper()
    expect(w).toMatchSnapshot()
  })

  it('should change column', () => {
    const w = wrapper()
    w.find('ChartSeriesSelect[column="B"] select[name="column"]').simulate('change', { target: { value: 'C' } })
    expect(w.prop('onChange')).toHaveBeenCalledWith([
      { column: 'A', color: '#aaaaaa' },
      { column: 'C', color: '#bbbbbb' }
    ])
  })

  it('should add a column', () => {
    const w = wrapper()
    w.find('button[title="add another column"]').simulate('click')
    w.find('ChartSeriesSelect').at(2).find('select[name="column"]').simulate('change', { target: { value: 'C' } })
    expect(w.prop('onChange')).toHaveBeenCalledWith([
      { column: 'A', color: '#aaaaaa' },
      { column: 'B', color: '#bbbbbb' },
      { column: 'C', color: '#fbaa6d' }
    ])
  })

  it('should present a placeholder when empty', () => {
    const w = wrapper({ series: [] })
    expect(w.find('ChartSeriesSelect')).toHaveLength(1)
    // No add/remove buttons
    expect(w.find('button[title="add another column"]')).toHaveLength(0)
    expect(w.find('button[title="remove last column"]')).toHaveLength(0)
  })

  it('should remove a column', () => {
    const w = wrapper()
    w.find('button[title="remove last column"]').simulate('click')
    expect(w.prop('onChange')).toHaveBeenCalledWith([
      { column: 'A', color: '#aaaaaa' }
    ])
  })

  it('should remove placeholder, not column, if placeholder selected', () => {
    const w = wrapper()
    w.find('button[title="add another column"]').simulate('click')
    w.find('button[title="remove last column"]').simulate('click')
    expect(w.find('ChartSeriesSelect')).toHaveLength(2)
    expect(w.prop('onChange')).not.toHaveBeenCalled()
  })

  it('should not allow removing last column', () => {
    const w = wrapper({ series: [
      { column: 'A', color: '#aaaaaa' }
    ]})
    expect(w.find('button[title="remove last column"]')).toHaveLength(0)
  })

  it('should not allow adding two placeholders', () => {
    const w = wrapper()
    w.find('button[title="add another column"]').simulate('click')
    expect(w.find('button[title="add another column"]')).toHaveLength(0)
  })

  it('should show loading', () => {
    const w = wrapper({ allColumns: null })
    expect(w.find('p.loading')).toHaveLength(1)
  })
})
