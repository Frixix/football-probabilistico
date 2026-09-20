from scipy.stats import poisson

def poisson_probability(mu, k):
    return poisson.pmf(k, mu)