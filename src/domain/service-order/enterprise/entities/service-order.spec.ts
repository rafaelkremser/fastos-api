import { makeServiceOrder } from 'test/factories/make-service-order'

describe('Service Order customer notice', () => {
  it('should need a notice when the device is ready or the quote is waiting', () => {
    expect(makeServiceOrder({ status: 'COMPLETED' }).needsCustomerNotice).toBe(
      true,
    )
    expect(
      makeServiceOrder({ status: 'WAITING_APPROVAL' }).needsCustomerNotice,
    ).toBe(true)
    expect(
      makeServiceOrder({ status: 'IN_PROGRESS' }).needsCustomerNotice,
    ).toBe(false)
  })

  it('should stop needing a notice once the customer is told', () => {
    const serviceOrder = makeServiceOrder({ status: 'COMPLETED' })

    serviceOrder.registerCustomerNotice()

    expect(serviceOrder.customerNotifiedAt).toBeInstanceOf(Date)
    expect(serviceOrder.needsCustomerNotice).toBe(false)
  })

  it('should need a new notice after the status changes', () => {
    const serviceOrder = makeServiceOrder({ status: 'WAITING_APPROVAL' })
    serviceOrder.registerCustomerNotice()

    serviceOrder.status = 'APPROVED'
    serviceOrder.status = 'COMPLETED'

    expect(serviceOrder.customerNotifiedAt).toBeNull()
    expect(serviceOrder.needsCustomerNotice).toBe(true)
  })

  it('should keep the notice when the status is set to the same one', () => {
    const serviceOrder = makeServiceOrder({ status: 'COMPLETED' })
    serviceOrder.registerCustomerNotice()

    serviceOrder.status = 'COMPLETED'

    expect(serviceOrder.needsCustomerNotice).toBe(false)
  })
})
