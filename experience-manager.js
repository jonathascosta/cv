export default class ExperienceManager {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
  }

  async fetchData(fileName) {
    try {
      const response = await fetch(fileName);
      return await response.json();
    } catch (error) {
      console.error('Error loading JSON file:', error);
    }
  }

  async fetchTemplate(templateFile) {
    try {
      const response = await fetch(templateFile);
      const html = await response.text();
      const template = document.createElement('template');
      template.innerHTML = html.trim();

      return document.importNode(template.content, true);
    } catch (error) {
      console.error('Error loading template file:', error);
    }
  }

  fillExperienceElement(templateContent, exp) {
    const template = templateContent.cloneNode(true);
    Object.keys(exp).forEach(key => {
      const elements = template.querySelectorAll(`[data-fill="${key}"]`);
      elements.forEach(element => {
        switch (key) {
          case 'achievements':
          case 'technologies':
            const itemTemplate = element.querySelector('[data-item]');
            element.innerHTML = '';
            exp[key].forEach(item => {
              const newItem = itemTemplate.cloneNode(true);
              newItem.textContent = item;
              element.appendChild(newItem);
            });
            break;

          default:
            element.textContent = exp[key];
            break;
        }
      });
    });
    return template;
  }

  calculateDays(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  }

  calculateSkillPercentages(experiences) {
    let techCounter = {};
    let totalDays = 0;
    let importanceFactor = 2.0;
    const decayFactor = 0.8;

    for (const exp of experiences) {
      const start = exp.start;
      const end = exp.end || "2023-10-14";
      const days = this.calculateDays(start, end);

      totalDays += days * importanceFactor;
      for (const tech of exp.technologies) {
        techCounter[tech] = (techCounter[tech] || 0) + days * importanceFactor;
      }

      importanceFactor *= decayFactor;
    }

    const techPercentage = {};
    for (const [tech, days] of Object.entries(techCounter)) {
      techPercentage[tech] = (days / totalDays * 100);
    }

    return techPercentage;
  }

  renderSkillBars(techPercentage, skillTemplate) {
    const skillContainer = document.querySelector('.skills');

    for (const [tech, percentage] of Object.entries(techPercentage)) {
      const filledSkillTemplate = skillTemplate.cloneNode(true);
      filledSkillTemplate.querySelector('.skill-name').textContent = tech;
      filledSkillTemplate.querySelector('.skill-level div').style.width = `${percentage}%`;
      skillContainer.appendChild(filledSkillTemplate);
    }
  }

  render() {
    Promise.all([
      this.fetchData('./data.json'),
      this.fetchTemplate('../experience-template.html'),
      this.fetchTemplate('../skill-template.html')
    ])
      .then(([data, templateContent, skillTemplate]) => {
        data.experiences.forEach(exp => {
          const filledTemplate = this.fillExperienceElement(templateContent, exp);
          this.container.appendChild(filledTemplate);
        });

        const techPercentage = this.calculateSkillPercentages(data.experiences);
        const sortedTechs = Object.keys(techPercentage).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        const sortedTechPercentage = {};
        for (const tech of sortedTechs) {
          sortedTechPercentage[tech] = techPercentage[tech];
        }

        this.renderSkillBars(sortedTechPercentage, skillTemplate);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const expManager = new ExperienceManager('div.experience');
  expManager.render();
});
