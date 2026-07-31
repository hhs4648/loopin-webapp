const fs = require('fs')
const { Resvg } = require('@resvg/resvg-js')

const files = [
  'onboarding-teacher-01-terms.svg',
  'onboarding-teacher-02-school.svg',
  'onboarding-teacher-03-name.svg',
  'onboarding-student-03-birthdate.svg',
  'onboarding-student-04-grade.svg',
  'onboarding-student-06-purpose.svg',
  'onboarding-curriculum-course.svg',
]

for (const f of files) {
  const inner = fs.readFileSync(`public/assets/${f}`, 'utf8')
  const body = inner.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const wrapped = `<svg width="393" height="90" viewBox="0 100 393 90" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
  try {
    const resvg = new Resvg(Buffer.from(wrapped), {
      fitTo: { mode: 'width', value: 786 },
    })
    fs.writeFileSync(
      `tmp-onboarding-titles/title-${f.replace('.svg', '.png')}`,
      resvg.render().asPng(),
    )
    console.log('ok', f)
  } catch (e) {
    console.log('fail', f, e.message)
  }
}
