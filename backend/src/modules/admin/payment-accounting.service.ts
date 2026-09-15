    for (const payment of history) if (!firstPaymentIdBySchool.has(payment.schoolId)) firstPaymentIdBySchool.set(payment.schoolId, payment.id);

    let data = rows.map((payment) => {
      const firstPaymentId = firstPaymentIdBySchool.get(payment.schoolId);
      const paymentType = payment.status === 'APPROVED'
        ? (firstPaymentId === payment.id ? 'FIRST_PAYMENT' : 'RECURRING')
        : firstPaymentId ? 'RENEWAL_PENDING' : 'FIRST_PAYMENT_PENDING';
      return { ...payment, paymentType };
    });
    if (requestedType) data = data.filter((payment) => payment.paymentType === requestedType).slice((page - 1) * limit, page * limit);
    const total = requestedType ? data.length + Math.max(0, rows.filter((_p) => false).length) : totalBeforeType;
    // Recompute the filtered total when a type filter is active so pagination is accurate.
    const filteredRows = requestedType
      ? (await this.prisma.onboardingPayment.findMany({ where, orderBy: { createdAt: 'desc' }, include: { school: { select: { name: true, slug: true } } } }))
      : [];
    if (requestedType) {
      const filteredSchoolIds = [...new Set(filteredRows.map((p) => p.schoolId))];
      const filteredHistory = filteredSchoolIds.length ? await this.prisma.onboardingPayment.findMany({ where: { schoolId: { in: filteredSchoolIds }, status: 'APPROVED' }, orderBy: { createdAt: 'asc' }, select: { id: true, schoolId: true } }) : [];
      const firstIds = new Map<string, string>();